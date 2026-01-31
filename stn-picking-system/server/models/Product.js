const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
	{
		productCode: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
		},
		productName: {
			type: String,
			required: true,
			trim: true,
		},
		variant: {
			type: String,
			trim: true,
		},
		barcode: {
			type: String,
			unique: true,
			sparse: true,
			trim: true,
		},
		originalBarcode: {
			type: String,
			trim: true,
			index: true,
		},
		hasPhysicalBarcode: {
			type: Boolean,
			default: true,
		},
		rackId: {
			type: String,
			trim: true,
		},
		rackSequence: {
			type: Number,
			default: 0,
		},
		category: {
			type: String,
			trim: true,
		},
		brand: {
			type: String,
			trim: true,
		},
		brandForm: {
			type: String,
			trim: true,
		},
		mrp: {
			type: Number,
			default: 0,
		},
		slp: {
			type: Number,
			default: 0,
		},
		rlp: {
			type: Number,
			default: 0,
		},
		upc: {
			type: String,
			trim: true,
		},
		units: {
			type: Number,
			default: 1,
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

// Index for fast barcode lookups
productSchema.index({ barcode: 1 });
productSchema.index({ productCode: 1 });
productSchema.index({ category: 1 });
productSchema.index({ rackId: 1, rackSequence: 1 });

module.exports = mongoose.model("Product", productSchema);
