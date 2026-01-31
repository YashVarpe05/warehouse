const mongoose = require("mongoose");

const scanLogSchema = new mongoose.Schema(
	{
		pickListId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "PickList",
		},
		pickListCode: {
			type: String,
		},
		scannedCode: {
			type: String,
			required: true,
		},
		expectedCode: {
			type: String,
		},
		productCode: {
			type: String,
		},
		isMatch: {
			type: Boolean,
			required: true,
		},
		scanResult: {
			type: String,
			enum: [
				"SUCCESS",
				"WRONG_PRODUCT",
				"NOT_IN_LIST",
				"ALREADY_COMPLETED",
				"EXCESS",
				"NOT_FOUND",
			],
			required: true,
		},
		operator: {
			type: String,
		},
		branch: {
			type: String,
		},
		responseTimeMs: {
			type: Number,
		},
		deviceType: {
			type: String,
			enum: ["CAMERA", "USB_SCANNER", "MANUAL"],
			default: "MANUAL",
		},
	},
	{
		timestamps: true,
	},
);

// Indexes for analytics and fast queries
scanLogSchema.index({ pickListId: 1, createdAt: -1 });
scanLogSchema.index({ branch: 1, createdAt: -1 });
scanLogSchema.index({ isMatch: 1, createdAt: -1 });
scanLogSchema.index({ productCode: 1, createdAt: -1 });

module.exports = mongoose.model("ScanLog", scanLogSchema);
