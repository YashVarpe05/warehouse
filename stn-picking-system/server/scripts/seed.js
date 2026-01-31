/**
 * Seed script to populate demo data
 * Run: node scripts/seed.js
 */

require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const {
	Product,
	Branch,
	Rack,
	PickList,
	GeneratedBarcode,
} = require("../models");

const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/stn-picking";

const branches = [
	{
		branchId: "PUNE-HDP",
		branchName: "Pune-Hadapsar",
		city: "Pune",
		state: "Maharashtra",
	},
	{
		branchId: "PUNE-KTJ",
		branchName: "Pune-Katraj",
		city: "Pune",
		state: "Maharashtra",
	},
	{
		branchId: "MUM-AND",
		branchName: "Mumbai-Andheri",
		city: "Mumbai",
		state: "Maharashtra",
	},
];

const racks = [
	{ rackId: "R1-A", zone: "Zone-A", aisle: "A", level: "1", sequence: 1 },
	{ rackId: "R1-B", zone: "Zone-A", aisle: "A", level: "2", sequence: 2 },
	{ rackId: "R2-A", zone: "Zone-A", aisle: "B", level: "1", sequence: 3 },
	{ rackId: "R2-B", zone: "Zone-A", aisle: "B", level: "2", sequence: 4 },
	{ rackId: "R3-A", zone: "Zone-B", aisle: "C", level: "1", sequence: 5 },
	{ rackId: "R3-B", zone: "Zone-B", aisle: "C", level: "2", sequence: 6 },
];

const products = [
	// Products WITH physical barcodes
	{
		productCode: "SOAP001",
		productName: "Dove Beauty Bar",
		variant: "100g",
		barcode: "8901030504594",
		hasPhysicalBarcode: true,
		rackId: "R1-A",
		rackSequence: 1,
		category: "Personal Care",
		brand: "Dove",
		mrp: 65,
		slp: 60,
		rlp: 55,
	},
	{
		productCode: "SHAMP001",
		productName: "Head & Shoulders",
		variant: "340ml",
		barcode: "4902430901024",
		hasPhysicalBarcode: true,
		rackId: "R1-A",
		rackSequence: 2,
		category: "Hair Care",
		brand: "P&G",
		mrp: 399,
		slp: 370,
		rlp: 350,
	},
	{
		productCode: "TOOTH001",
		productName: "Colgate MaxFresh",
		variant: "150g",
		barcode: "8901314010122",
		hasPhysicalBarcode: true,
		rackId: "R1-B",
		rackSequence: 1,
		category: "Oral Care",
		brand: "Colgate",
		mrp: 110,
		slp: 100,
		rlp: 95,
	},
	{
		productCode: "DETERG001",
		productName: "Surf Excel Matic",
		variant: "2kg",
		barcode: "8901030526145",
		hasPhysicalBarcode: true,
		rackId: "R2-A",
		rackSequence: 1,
		category: "Laundry",
		brand: "HUL",
		mrp: 450,
		slp: 420,
		rlp: 400,
	},
	{
		productCode: "CLEAN001",
		productName: "Harpic Power Plus",
		variant: "1L",
		barcode: "5011417559239",
		hasPhysicalBarcode: true,
		rackId: "R2-B",
		rackSequence: 1,
		category: "Cleaning",
		brand: "Reckitt",
		mrp: 199,
		slp: 180,
		rlp: 170,
	},

	// Products WITHOUT physical barcodes (need generated ones)
	{
		productCode: "VAP001",
		productName: "Vap Cleaner",
		variant: "500ml",
		hasPhysicalBarcode: false,
		rackId: "R3-A",
		rackSequence: 1,
		category: "Cleaning",
		brand: "Vap",
		mrp: 85,
		slp: 75,
		rlp: 70,
	},
	{
		productCode: "ACTION001",
		productName: "Action Floor Cleaner",
		variant: "1L",
		hasPhysicalBarcode: false,
		rackId: "R3-A",
		rackSequence: 2,
		category: "Cleaning",
		brand: "Action",
		mrp: 120,
		slp: 110,
		rlp: 100,
	},
	{
		productCode: "LOCAL001",
		productName: "Local Phenyl",
		variant: "1L",
		hasPhysicalBarcode: false,
		rackId: "R3-B",
		rackSequence: 1,
		category: "Cleaning",
		brand: "Local",
		mrp: 50,
		slp: 45,
		rlp: 40,
	},
	{
		productCode: "SOAP002",
		productName: "Lux Beauty Soap",
		variant: "150g",
		barcode: "8901030695032",
		hasPhysicalBarcode: true,
		rackId: "R1-A",
		rackSequence: 3,
		category: "Personal Care",
		brand: "Lux",
		mrp: 55,
		slp: 50,
		rlp: 45,
	},
	{
		productCode: "DISH001",
		productName: "Vim Dishwash Bar",
		variant: "500g",
		barcode: "8901030517518",
		hasPhysicalBarcode: true,
		rackId: "R2-A",
		rackSequence: 2,
		category: "Cleaning",
		brand: "Vim",
		mrp: 42,
		slp: 38,
		rlp: 35,
	},
];

async function seed() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log("Connected to MongoDB");

		// Clear existing data
		await Promise.all([
			Product.deleteMany({}),
			Branch.deleteMany({}),
			Rack.deleteMany({}),
			PickList.deleteMany({}),
			GeneratedBarcode.deleteMany({}),
		]);
		console.log("Cleared existing data");

		// Insert branches
		await Branch.insertMany(branches);
		console.log(`Inserted ${branches.length} branches`);

		// Insert racks
		await Rack.insertMany(racks);
		console.log(`Inserted ${racks.length} racks`);

		// Insert products
		const insertedProducts = await Product.insertMany(products);
		console.log(`Inserted ${products.length} products`);

		// Generate barcodes for products without physical barcodes
		const noBarcode = insertedProducts.filter((p) => !p.hasPhysicalBarcode);
		for (const product of noBarcode) {
			const generatedCode = `GEN-${product.productCode}-001`;

			const genBarcode = new GeneratedBarcode({
				generatedCode,
				productCode: product.productCode,
				productId: product._id,
				barcodeType: "QR",
			});
			await genBarcode.save();

			// Update product with generated barcode
			await Product.findByIdAndUpdate(product._id, { barcode: generatedCode });
		}
		console.log(
			`Generated ${noBarcode.length} barcodes for products without physical barcodes`,
		);

		// Create a sample pick list
		const samplePickList = new PickList({
			pickListId: "PL-20260130-001",
			branch: "Pune-Hadapsar",
			operator: "Demo User",
			status: "PENDING",
			items: [
				{
					productCode: "SOAP001",
					productName: "Dove Beauty Bar",
					barcode: "8901030504594",
					requiredQty: 5,
					rackId: "R1-A",
					rackSequence: 1,
				},
				{
					productCode: "SHAMP001",
					productName: "Head & Shoulders",
					barcode: "4902430901024",
					requiredQty: 3,
					rackId: "R1-A",
					rackSequence: 2,
				},
				{
					productCode: "VAP001",
					productName: "Vap Cleaner",
					barcode: "GEN-VAP001-001",
					requiredQty: 10,
					rackId: "R3-A",
					rackSequence: 1,
				},
				{
					productCode: "DETERG001",
					productName: "Surf Excel Matic",
					barcode: "8901030526145",
					requiredQty: 4,
					rackId: "R2-A",
					rackSequence: 1,
				},
			],
		});
		await samplePickList.save();
		console.log("Created sample pick list");

		console.log("\n✅ Seed completed successfully!\n");
		console.log("Demo credentials:");
		console.log("  Products with barcodes: SOAP001, SHAMP001, TOOTH001, etc.");
		console.log(
			"  Products with generated barcodes: VAP001, ACTION001, LOCAL001",
		);
		console.log("  Sample pick list: PL-20260130-001");

		process.exit(0);
	} catch (error) {
		console.error("Seed error:", error);
		process.exit(1);
	}
}

seed();
