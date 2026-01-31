const express = require("express");
const router = express.Router();
const { ScanLog, PickList, Product } = require("../models");

// GET /api/analytics/summary - Dashboard summary
router.get("/summary", async (req, res) => {
	try {
		const { branch, date } = req.query;

		const today = date ? new Date(date) : new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const matchFilter = {
			createdAt: { $gte: today, $lt: tomorrow },
		};
		if (branch) matchFilter.branch = branch;

		// Get today's pick lists
		const pickLists = await PickList.find(matchFilter);

		const totalPickLists = pickLists.length;
		const completedPickLists = pickLists.filter(
			(p) => p.status === "COMPLETED",
		).length;
		const inProgressPickLists = pickLists.filter(
			(p) => p.status === "IN_PROGRESS",
		).length;

		const totalItems = pickLists.reduce((sum, p) => sum + p.totalItems, 0);
		const pickedItems = pickLists.reduce((sum, p) => sum + p.pickedItems, 0);
		const errorCount = pickLists.reduce((sum, p) => sum + p.errorCount, 0);

		// Get scan stats
		const scanStats = await ScanLog.aggregate([
			{ $match: { createdAt: { $gte: today, $lt: tomorrow } } },
			{
				$group: {
					_id: "$scanResult",
					count: { $sum: 1 },
					avgResponseTime: { $avg: "$responseTimeMs" },
				},
			},
		]);

		const successScans = scanStats.find((s) => s._id === "SUCCESS")?.count || 0;
		const errorScans = scanStats
			.filter((s) => s._id !== "SUCCESS")
			.reduce((sum, s) => sum + s.count, 0);
		const avgResponseTime = Math.round(
			scanStats.reduce((sum, s) => sum + (s.avgResponseTime || 0), 0) /
				(scanStats.length || 1),
		);

		res.json({
			success: true,
			data: {
				pickLists: {
					total: totalPickLists,
					completed: completedPickLists,
					inProgress: inProgressPickLists,
					pending: totalPickLists - completedPickLists - inProgressPickLists,
				},
				items: {
					total: totalItems,
					picked: pickedItems,
					pending: totalItems - pickedItems,
					progress:
						totalItems > 0 ? Math.round((pickedItems / totalItems) * 100) : 0,
				},
				scans: {
					success: successScans,
					errors: errorScans,
					total: successScans + errorScans,
					errorRate:
						successScans + errorScans > 0
							? Math.round((errorScans / (successScans + errorScans)) * 100)
							: 0,
					avgResponseTimeMs: avgResponseTime,
				},
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/analytics/branch-wise - Branch-wise statistics
router.get("/branch-wise", async (req, res) => {
	try {
		const { startDate, endDate } = req.query;

		const match = {};
		if (startDate && endDate) {
			match.createdAt = {
				$gte: new Date(startDate),
				$lte: new Date(endDate),
			};
		}

		const branchStats = await PickList.aggregate([
			{ $match: match },
			{
				$group: {
					_id: "$branch",
					totalPickLists: { $sum: 1 },
					completedPickLists: {
						$sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
					},
					totalItems: { $sum: "$totalItems" },
					pickedItems: { $sum: "$pickedItems" },
					errorCount: { $sum: "$errorCount" },
				},
			},
			{ $sort: { totalPickLists: -1 } },
		]);

		res.json({ success: true, data: branchStats });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/analytics/product-wise - Product-wise statistics
router.get("/product-wise", async (req, res) => {
	try {
		const { startDate, endDate, limit = 20 } = req.query;

		const match = { isMatch: true };
		if (startDate && endDate) {
			match.createdAt = {
				$gte: new Date(startDate),
				$lte: new Date(endDate),
			};
		}

		const productStats = await ScanLog.aggregate([
			{ $match: match },
			{
				$group: {
					_id: "$productCode",
					totalScans: { $sum: 1 },
					avgResponseTime: { $avg: "$responseTimeMs" },
				},
			},
			{ $sort: { totalScans: -1 } },
			{ $limit: parseInt(limit) },
		]);

		// Enrich with product details
		const enrichedStats = await Promise.all(
			productStats.map(async (stat) => {
				const product = await Product.findOne({ productCode: stat._id });
				return {
					productCode: stat._id,
					productName: product?.productName || "Unknown",
					category: product?.category,
					rackId: product?.rackId,
					totalScans: stat.totalScans,
					avgResponseTime: Math.round(stat.avgResponseTime),
				};
			}),
		);

		res.json({ success: true, data: enrichedStats });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/analytics/daily-summary - Daily loose quantity summary
router.get("/daily-summary", async (req, res) => {
	try {
		const { days = 7, branch } = req.query;

		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - parseInt(days));

		const match = {
			createdAt: { $gte: startDate, $lte: endDate },
		};
		if (branch) match.branch = branch;

		const dailyStats = await PickList.aggregate([
			{ $match: match },
			{
				$group: {
					_id: {
						$dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
					},
					totalPickLists: { $sum: 1 },
					totalItems: { $sum: "$totalItems" },
					pickedItems: { $sum: "$pickedItems" },
					errorCount: { $sum: "$errorCount" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		res.json({ success: true, data: dailyStats });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/analytics/error-analysis - Error breakdown
router.get("/error-analysis", async (req, res) => {
	try {
		const { startDate, endDate, branch } = req.query;

		const match = { isMatch: false };
		if (startDate && endDate) {
			match.createdAt = {
				$gte: new Date(startDate),
				$lte: new Date(endDate),
			};
		}
		if (branch) match.branch = branch;

		const errorStats = await ScanLog.aggregate([
			{ $match: match },
			{
				$group: {
					_id: "$scanResult",
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
		]);

		res.json({ success: true, data: errorStats });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/analytics/recent-scans - Recent scan activity feed
router.get("/recent-scans", async (req, res) => {
	try {
		const { limit = 50, branch } = req.query;

		const match = {};
		if (branch) match.branch = branch;

		const recentScans = await ScanLog.find(match)
			.sort({ createdAt: -1 })
			.limit(parseInt(limit))
			.lean();

		// Enrich with product details
		const enrichedScans = await Promise.all(
			recentScans.map(async (scan) => {
				let product = null;
				if (scan.productCode) {
					product = await Product.findOne({
						productCode: scan.productCode,
					}).lean();
				}
				return {
					...scan,
					productName: product?.productName || "Unknown",
					brand: product?.brand,
					category: product?.category,
				};
			}),
		);

		res.json({ success: true, data: enrichedScans });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/analytics/category-stats - Category distribution
router.get("/category-stats", async (req, res) => {
	try {
		const categoryStats = await Product.aggregate([
			{ $match: { isActive: true } },
			{
				$group: {
					_id: "$category",
					productCount: { $sum: 1 },
					brands: { $addToSet: "$brand" },
				},
			},
			{
				$project: {
					category: "$_id",
					productCount: 1,
					brandCount: { $size: "$brands" },
				},
			},
			{ $sort: { productCount: -1 } },
		]);

		// Get scan counts per category
		const scanStats = await ScanLog.aggregate([
			{ $match: { isMatch: true } },
			{
				$lookup: {
					from: "products",
					localField: "productCode",
					foreignField: "productCode",
					as: "product",
				},
			},
			{ $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
			{
				$group: {
					_id: "$product.category",
					scanCount: { $sum: 1 },
				},
			},
		]);

		const scanMap = new Map(scanStats.map((s) => [s._id, s.scanCount]));

		const result = categoryStats.map((cat) => ({
			...cat,
			scanCount: scanMap.get(cat._id) || 0,
		}));

		res.json({ success: true, data: result });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/analytics/brand-stats - Brand performance
router.get("/brand-stats", async (req, res) => {
	try {
		const { limit = 15 } = req.query;

		const brandStats = await Product.aggregate([
			{ $match: { isActive: true, brand: { $ne: "" } } },
			{
				$group: {
					_id: "$brand",
					productCount: { $sum: 1 },
					categories: { $addToSet: "$category" },
					avgMrp: { $avg: "$mrp" },
				},
			},
			{
				$project: {
					brand: "$_id",
					productCount: 1,
					categoryCount: { $size: "$categories" },
					avgMrp: { $round: ["$avgMrp", 2] },
				},
			},
			{ $sort: { productCount: -1 } },
			{ $limit: parseInt(limit) },
		]);

		res.json({ success: true, data: brandStats });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

module.exports = router;
