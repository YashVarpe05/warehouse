const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");

// CSV parsing helper
function parseCSVLine(line) {
	const result = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === "," && !inQuotes) {
			result.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}

// Import products from CSV
router.post("/csv", async (req, res) => {
	try {
		const csvPath = path.resolve(__dirname, "../../../excel/master.csv");

		if (!fs.existsSync(csvPath)) {
			return res.status(404).json({
				success: false,
				message: "CSV file not found at: " + csvPath,
			});
		}

		const fileContent = fs.readFileSync(csvPath, "utf-8");
		const lines = fileContent.split("\n").filter((line) => line.trim());

		if (lines.length < 2) {
			return res.status(400).json({
				success: false,
				message: "CSV file is empty or has no data rows",
			});
		}

		// Parse header
		const headers = parseCSVLine(lines[0]);
		console.log("CSV Headers:", headers);

		// Map CSV columns to Product fields
		const columnMap = {
			"CombiBarCode+MRP": "productCode",
			company: "company",
			category: "category",
			brand: "brand",
			BrandForm: "brandForm",
			SBF: "productName",
			BarCode: "barcode",
			UPC: "upc",
			MRP: "mrp",
			SLP: "slp",
			RLP: "rlp",
			Units: "units",
		};

		const products = [];
		const errors = [];
		const seenBarcodes = new Set();

		// Parse data rows
		for (let i = 1; i < lines.length; i++) {
			try {
				const values = parseCSVLine(lines[i]);
				const row = {};

				headers.forEach((header, index) => {
					row[header] = values[index] || "";
				});

				// Get productCode (CombiBarCode+MRP like "14987176102024_240")
				const productCode = row["CombiBarCode+MRP"]?.toString().trim();
				if (!productCode) continue;

				// Extract barcode from productCode (part before underscore)
				const parts = productCode.split("_");
				const extractedBarcode = parts[0] || "";
				const mrpFromCode = parts[1] ? parseFloat(parts[1]) : 0;

				// Skip duplicates within CSV
				if (seenBarcodes.has(productCode)) continue;
				seenBarcodes.add(productCode);

				// Use MRP from column or extracted from code
				const mrpValue = parseFloat(row["MRP"]) || mrpFromCode || 0;

				const product = {
					productCode: productCode,
					productName: row["SBF"]?.toString().trim() || "Unknown Product",
					variant: row["BrandForm"]?.toString().trim() || "",
					barcode: productCode, // Use full productCode as unique barcode
					originalBarcode: extractedBarcode, // The scannable barcode part
					category: row["category"]?.toString().trim() || "",
					brand: row["brand"]?.toString().trim() || "",
					brandForm: row["BrandForm"]?.toString().trim() || "",
					mrp: mrpValue,
					slp: parseFloat(row["SLP"]) || 0,
					rlp: parseFloat(row["RLP"]) || 0,
					upc: row["UPC"]?.toString().trim() || "",
					units: parseInt(row["Units"]) || 1,
					hasPhysicalBarcode: true,
					isActive: true,
				};

				products.push(product);
			} catch (err) {
				errors.push({ line: i + 1, error: err.message });
			}
		}

		console.log(`Parsed ${products.length} products from CSV`);

		// Clear existing products and insert new ones
		const clearExisting = req.query.clear === "true";
		if (clearExisting) {
			await Product.deleteMany({});
			console.log("Cleared existing products");
		}

		// Use bulkWrite for upsert
		const bulkOps = products.map((product) => ({
			updateOne: {
				filter: { productCode: product.productCode },
				update: { $set: product },
				upsert: true,
			},
		}));

		const result = await Product.bulkWrite(bulkOps, { ordered: false });

		res.json({
			success: true,
			message: "CSV import completed",
			stats: {
				totalRows: lines.length - 1,
				parsedProducts: products.length,
				inserted: result.upsertedCount || 0,
				updated: result.modifiedCount || 0,
				errors: errors.length,
			},
			errors: errors.slice(0, 10), // Show first 10 errors
		});
	} catch (error) {
		console.error("CSV import error:", error);
		res.status(500).json({
			success: false,
			message: "CSV import failed: " + error.message,
		});
	}
});

// Get import status / preview
router.get("/csv/preview", async (req, res) => {
	try {
		const csvPath = path.resolve(__dirname, "../../../excel/master.csv");

		if (!fs.existsSync(csvPath)) {
			return res.status(404).json({
				success: false,
				message: "CSV file not found",
				path: csvPath,
			});
		}

		const stats = fs.statSync(csvPath);
		const fileContent = fs.readFileSync(csvPath, "utf-8");
		const lines = fileContent.split("\n").filter((line) => line.trim());

		const headers = parseCSVLine(lines[0]);
		const sampleData = [];

		for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
			const values = parseCSVLine(lines[i]);
			const row = {};
			headers.forEach((header, index) => {
				row[header] = values[index] || "";
			});
			sampleData.push(row);
		}

		res.json({
			success: true,
			file: {
				path: csvPath,
				size: stats.size,
				modified: stats.mtime,
			},
			totalRows: lines.length - 1,
			headers: headers,
			sampleData: sampleData,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
});

module.exports = router;
