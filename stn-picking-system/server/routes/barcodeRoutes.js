const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { GeneratedBarcode, Product } = require("../models");

// POST /api/barcodes/generate - Generate barcode for product
router.post("/generate", async (req, res) => {
	try {
		const { productCode, barcodeType = "QR" } = req.body;

		if (!productCode) {
			return res.status(400).json({
				success: false,
				message: "Product code is required",
			});
		}

		// Check if product exists
		const product = await Product.findOne({
			productCode: productCode.toUpperCase(),
		});
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Generate unique barcode
		const prefix = "GEN";
		const timestamp = Date.now().toString(36).toUpperCase();
		const random = uuidv4().split("-")[0].toUpperCase();
		const generatedCode =
			`${prefix}-${productCode.toUpperCase()}-${timestamp}-${random}`.substring(
				0,
				30,
			);

		const barcode = new GeneratedBarcode({
			generatedCode,
			productCode: productCode.toUpperCase(),
			productId: product._id,
			barcodeType,
		});

		await barcode.save();

		// Update product to indicate it has a generated barcode
		if (!product.hasPhysicalBarcode) {
			product.barcode = generatedCode;
			await product.save();
		}

		res.status(201).json({
			success: true,
			data: {
				generatedCode,
				productCode: product.productCode,
				productName: product.productName,
				barcodeType,
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/barcodes/unassigned - List products without barcodes
router.get("/unassigned", async (req, res) => {
	try {
		const products = await Product.find({
			hasPhysicalBarcode: false,
			$or: [
				{ barcode: { $exists: false } },
				{ barcode: null },
				{ barcode: "" },
			],
			isActive: true,
		});

		res.json({ success: true, data: products });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/barcodes/product/:productCode - Get barcodes for product
router.get("/product/:productCode", async (req, res) => {
	try {
		const barcodes = await GeneratedBarcode.find({
			productCode: req.params.productCode.toUpperCase(),
			isActive: true,
		});

		res.json({ success: true, data: barcodes });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// POST /api/barcodes/:code/print - Mark barcode as printed
router.post("/:code/print", async (req, res) => {
	try {
		const barcode = await GeneratedBarcode.findOneAndUpdate(
			{ generatedCode: req.params.code },
			{
				$set: { printedAt: new Date() },
				$inc: { printCount: 1 },
			},
			{ new: true },
		);

		if (!barcode) {
			return res.status(404).json({
				success: false,
				message: "Barcode not found",
			});
		}

		res.json({ success: true, data: barcode });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

module.exports = router;
