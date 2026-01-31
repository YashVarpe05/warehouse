const mongoose = require("mongoose");

const generatedBarcodeSchema = new mongoose.Schema(
	{
		generatedCode: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
		},
		productCode: {
			type: String,
			required: true,
			trim: true,
		},
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
		},
		barcodeType: {
			type: String,
			enum: ["QR", "CODE128", "EAN13"],
			default: "QR",
		},
		printedAt: {
			type: Date,
		},
		printCount: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
);

// Index for fast lookups
generatedBarcodeSchema.index({ generatedCode: 1 });
generatedBarcodeSchema.index({ productCode: 1 });
generatedBarcodeSchema.index({ isActive: 1 });

module.exports = mongoose.model("GeneratedBarcode", generatedBarcodeSchema);
