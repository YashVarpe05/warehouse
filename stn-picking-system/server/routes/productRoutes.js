const express = require("express");
const router = express.Router();
const { Product, GeneratedBarcode } = require("../models");

// GET /api/products - List products with filters
router.get("/", async (req, res) => {
	try {
		const {
			category,
			search,
			rackId,
			hasBarcode,
			page = 1,
			limit = 50,
		} = req.query;

		const filter = { isActive: true };

		if (category) filter.category = category;
		if (rackId) filter.rackId = rackId;
		if (hasBarcode === "true") filter.hasPhysicalBarcode = true;
		if (hasBarcode === "false") filter.hasPhysicalBarcode = false;

		if (search) {
			filter.$or = [
				{ barcode: { $regex: search, $options: "i" } },
				{ productCode: { $regex: search, $options: "i" } },
				{ productName: { $regex: search, $options: "i" } },
				{ upc: { $regex: search, $options: "i" } },
			];
		}

		const products = await Product.find(filter)
			.sort({ rackId: 1, rackSequence: 1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const total = await Product.countDocuments(filter);

		res.json({
			success: true,
			data: products,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/products/barcode/:barcode - Get product by barcode
router.get("/barcode/:barcode", async (req, res) => {
	try {
		const { barcode } = req.params;

		// First check physical barcode
		let product = await Product.findOne({
			barcode: barcode,
			isActive: true,
		});

		// If not found, check generated barcodes
		if (!product) {
			const generated = await GeneratedBarcode.findOne({
				generatedCode: barcode,
				isActive: true,
			}).populate("productId");

			if (generated && generated.productId) {
				product = generated.productId;
			}
		}

		// Also check UPC
		if (!product) {
			product = await Product.findOne({
				upc: barcode,
				isActive: true,
			});
		}

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found for barcode",
			});
		}

		res.json({ success: true, data: product });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/products/:id - Get product by ID
router.get("/:id", async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res
				.status(404)
				.json({ success: false, message: "Product not found" });
		}
		res.json({ success: true, data: product });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// POST /api/products - Create product
router.post("/", async (req, res) => {
	try {
		const product = new Product(req.body);
		await product.save();
		res.status(201).json({ success: true, data: product });
	} catch (error) {
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "Product code or barcode already exists",
			});
		}
		res.status(500).json({ success: false, message: error.message });
	}
});

// PUT /api/products/:id - Update product
router.put("/:id", async (req, res) => {
	try {
		const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!product) {
			return res
				.status(404)
				.json({ success: false, message: "Product not found" });
		}
		res.json({ success: true, data: product });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/products/categories/list - Get unique categories
router.get("/categories/list", async (req, res) => {
	try {
		const categories = await Product.distinct("category", { isActive: true });
		res.json({ success: true, data: categories.filter((c) => c) });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

module.exports = router;
