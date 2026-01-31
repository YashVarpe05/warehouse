const express = require("express");
const router = express.Router();
const { PickList, Product, GeneratedBarcode, ScanLog } = require("../models");

// POST /api/picklist - Create pick list
router.post("/", async (req, res) => {
	try {
		const { branch, items, operator } = req.body;

		if (!branch || !items || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Branch and items are required",
			});
		}

		// Generate pick list ID
		const date = new Date();
		const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
		const count = await PickList.countDocuments({
			createdAt: { $gte: new Date(date.setHours(0, 0, 0, 0)) },
		});
		const pickListId = `PL-${dateStr}-${String(count + 1).padStart(3, "0")}`;

		// Enrich items with product details and rack info
		const enrichedItems = await Promise.all(
			items.map(async (item) => {
				const product = await Product.findOne({
					productCode: item.productCode,
				});
				return {
					...item,
					productId: product?._id,
					productName: product?.productName,
					barcode: product?.barcode,
					rackId: product?.rackId || item.rackId,
					rackSequence: product?.rackSequence || item.rackSequence || 0,
					pickedQty: 0,
					itemStatus: "PENDING",
				};
			}),
		);

		const pickList = new PickList({
			pickListId,
			branch,
			operator,
			items: enrichedItems,
			status: "PENDING",
		});

		await pickList.save();

		res.status(201).json({ success: true, data: pickList });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/picklist - List pick lists
router.get("/", async (req, res) => {
	try {
		const { branch, status, date } = req.query;
		const filter = {};

		if (branch) filter.branch = branch;
		if (status) filter.status = status;
		if (date) {
			const startDate = new Date(date);
			startDate.setHours(0, 0, 0, 0);
			const endDate = new Date(date);
			endDate.setHours(23, 59, 59, 999);
			filter.createdAt = { $gte: startDate, $lte: endDate };
		}

		const pickLists = await PickList.find(filter)
			.sort({ createdAt: -1 })
			.limit(50);

		res.json({ success: true, data: pickLists });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/picklist/:id - Get pick list by ID
router.get("/:id", async (req, res) => {
	try {
		const pickList = await PickList.findOne({
			$or: [
				{ _id: req.params.id },
				{ pickListId: req.params.id.toUpperCase() },
			],
		});

		if (!pickList) {
			return res
				.status(404)
				.json({ success: false, message: "Pick list not found" });
		}

		res.json({ success: true, data: pickList });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/picklist/:id/status - Get pick list status summary
router.get("/:id/status", async (req, res) => {
	try {
		const pickList = await PickList.findOne({
			$or: [
				{ _id: req.params.id },
				{ pickListId: req.params.id.toUpperCase() },
			],
		});

		if (!pickList) {
			return res
				.status(404)
				.json({ success: false, message: "Pick list not found" });
		}

		const totalItems = pickList.items.reduce(
			(sum, item) => sum + item.requiredQty,
			0,
		);
		const pickedItems = pickList.items.reduce(
			(sum, item) => sum + item.pickedQty,
			0,
		);
		const pendingItems = totalItems - pickedItems;
		const completedProducts = pickList.items.filter(
			(i) => i.itemStatus === "PICKED",
		).length;
		const excessProducts = pickList.items.filter(
			(i) => i.itemStatus === "EXCESS",
		).length;

		res.json({
			success: true,
			data: {
				pickListId: pickList.pickListId,
				status: pickList.status,
				totalItems,
				pickedItems,
				pendingItems,
				completedProducts,
				excessProducts,
				totalProducts: pickList.items.length,
				errorCount: pickList.errorCount,
				progress:
					totalItems > 0 ? Math.round((pickedItems / totalItems) * 100) : 0,
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// POST /api/scan/validate - Validate a scanned barcode
router.post("/scan/validate", async (req, res) => {
	const startTime = Date.now();

	try {
		const {
			scannedCode,
			pickListId,
			operator,
			branch,
			deviceType = "MANUAL",
		} = req.body;

		if (!scannedCode) {
			return res.status(400).json({
				success: false,
				message: "Scanned code is required",
			});
		}

		// Find the product by various methods
		let product = await Product.findOne({ barcode: scannedCode });

		// Try productCode (matches CombiBarCode+MRP format like "14987176102024_240")
		if (!product) {
			product = await Product.findOne({ productCode: scannedCode });
		}

		// Try matching by barcode prefix (scanned code starts with the barcode)
		if (!product) {
			product = await Product.findOne({
				barcode: { $regex: `^${scannedCode}`, $options: "i" },
			});
		}

		// Try originalBarcode field (raw barcode from CSV)
		if (!product) {
			product = await Product.findOne({ originalBarcode: scannedCode });
		}

		// Check generated barcodes if not found
		if (!product) {
			const generated = await GeneratedBarcode.findOne({
				generatedCode: scannedCode.toUpperCase(),
				isActive: true,
			}).populate("productId");

			if (generated && generated.productId) {
				product = generated.productId;
			}
		}

		// Check UPC
		if (!product) {
			product = await Product.findOne({ upc: scannedCode });
		}

		// Product not found
		if (!product) {
			const log = new ScanLog({
				scannedCode,
				isMatch: false,
				scanResult: "NOT_FOUND",
				operator,
				branch,
				deviceType,
				responseTimeMs: Date.now() - startTime,
			});
			await log.save();

			return res.json({
				success: false,
				scanResult: "NOT_FOUND",
				message: "Product not found for scanned barcode",
				scannedCode,
				responseTimeMs: Date.now() - startTime,
			});
		}

		// If no pick list specified, just return product info
		if (!pickListId) {
			return res.json({
				success: true,
				scanResult: "PRODUCT_FOUND",
				message: "Product found",
				product: {
					productCode: product.productCode,
					productName: product.productName,
					variant: product.variant,
					rackId: product.rackId,
					mrp: product.mrp,
				},
				responseTimeMs: Date.now() - startTime,
			});
		}

		// Find pick list
		const pickList = await PickList.findOne({
			$or: [{ _id: pickListId }, { pickListId: pickListId.toUpperCase() }],
		});

		if (!pickList) {
			return res.status(404).json({
				success: false,
				message: "Pick list not found",
			});
		}

		// Find item in pick list
		const itemIndex = pickList.items.findIndex(
			(item) => item.productCode === product.productCode,
		);

		if (itemIndex === -1) {
			const log = new ScanLog({
				pickListId: pickList._id,
				pickListCode: pickList.pickListId,
				scannedCode,
				productCode: product.productCode,
				isMatch: false,
				scanResult: "NOT_IN_LIST",
				operator,
				branch,
				deviceType,
				responseTimeMs: Date.now() - startTime,
			});
			await log.save();

			pickList.errorCount += 1;
			await pickList.save();

			return res.json({
				success: false,
				scanResult: "NOT_IN_LIST",
				message: "Product not in this pick list",
				product: {
					productCode: product.productCode,
					productName: product.productName,
				},
				responseTimeMs: Date.now() - startTime,
			});
		}

		const item = pickList.items[itemIndex];

		// Check if already completed
		if (item.pickedQty >= item.requiredQty) {
			const log = new ScanLog({
				pickListId: pickList._id,
				pickListCode: pickList.pickListId,
				scannedCode,
				expectedCode: item.barcode,
				productCode: product.productCode,
				isMatch: true,
				scanResult: "EXCESS",
				operator,
				branch,
				deviceType,
				responseTimeMs: Date.now() - startTime,
			});
			await log.save();

			// Still increment for tracking
			pickList.items[itemIndex].pickedQty += 1;
			pickList.items[itemIndex].itemStatus = "EXCESS";
			await pickList.save();

			return res.json({
				success: true,
				scanResult: "EXCESS",
				warning: true,
				message: "Extra scan! Item already fully picked",
				product: {
					productCode: product.productCode,
					productName: product.productName,
				},
				pickedQty: pickList.items[itemIndex].pickedQty,
				requiredQty: item.requiredQty,
				responseTimeMs: Date.now() - startTime,
			});
		}

		// SUCCESS - Increment picked quantity
		pickList.items[itemIndex].pickedQty += 1;

		// Update item status
		if (pickList.items[itemIndex].pickedQty >= item.requiredQty) {
			pickList.items[itemIndex].itemStatus = "PICKED";
		} else {
			pickList.items[itemIndex].itemStatus = "PARTIAL";
		}

		// Update pick list status
		if (pickList.status === "PENDING") {
			pickList.status = "IN_PROGRESS";
			pickList.startedAt = new Date();
		}

		// Check if all items are picked
		const allPicked = pickList.items.every((i) => i.pickedQty >= i.requiredQty);
		if (allPicked) {
			pickList.status = "COMPLETED";
			pickList.completedAt = new Date();
		}

		await pickList.save();

		// Log successful scan
		const log = new ScanLog({
			pickListId: pickList._id,
			pickListCode: pickList.pickListId,
			scannedCode,
			expectedCode: item.barcode,
			productCode: product.productCode,
			isMatch: true,
			scanResult: "SUCCESS",
			operator,
			branch,
			deviceType,
			responseTimeMs: Date.now() - startTime,
		});
		await log.save();

		res.json({
			success: true,
			scanResult: "SUCCESS",
			message: "Scan recorded successfully",
			product: {
				productCode: product.productCode,
				productName: product.productName,
				rackId: product.rackId,
			},
			pickedQty: pickList.items[itemIndex].pickedQty,
			requiredQty: item.requiredQty,
			isComplete: pickList.items[itemIndex].pickedQty >= item.requiredQty,
			pickListComplete: allPicked,
			responseTimeMs: Date.now() - startTime,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// DELETE /api/picklist/:pickListId/item/:productCode/scan - Remove one scan
router.delete("/:pickListId/item/:productCode/scan", async (req, res) => {
	try {
		const { pickListId, productCode } = req.params;

		const pickList = await PickList.findOne({
			$or: [{ _id: pickListId }, { pickListId: pickListId.toUpperCase() }],
		});

		if (!pickList) {
			return res
				.status(404)
				.json({ success: false, message: "Pick list not found" });
		}

		const itemIndex = pickList.items.findIndex(
			(item) => item.productCode === productCode.toUpperCase(),
		);

		if (itemIndex === -1) {
			return res
				.status(404)
				.json({ success: false, message: "Item not in pick list" });
		}

		if (pickList.items[itemIndex].pickedQty > 0) {
			pickList.items[itemIndex].pickedQty -= 1;

			// Update status
			const item = pickList.items[itemIndex];
			if (item.pickedQty === 0) {
				item.itemStatus = "PENDING";
			} else if (item.pickedQty < item.requiredQty) {
				item.itemStatus = "PARTIAL";
			} else if (item.pickedQty === item.requiredQty) {
				item.itemStatus = "PICKED";
			}

			// Update pick list status
			const allPicked = pickList.items.every(
				(i) => i.pickedQty >= i.requiredQty,
			);
			if (!allPicked && pickList.status === "COMPLETED") {
				pickList.status = "IN_PROGRESS";
				pickList.completedAt = null;
			}

			await pickList.save();
		}

		res.json({
			success: true,
			message: "Scan removed",
			pickedQty: pickList.items[itemIndex].pickedQty,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

module.exports = router;
