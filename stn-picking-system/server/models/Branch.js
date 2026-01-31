const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
	{
		branchId: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
		},
		branchName: {
			type: String,
			required: true,
			trim: true,
		},
		address: {
			type: String,
			trim: true,
		},
		city: {
			type: String,
			trim: true,
		},
		state: {
			type: String,
			trim: true,
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

module.exports = mongoose.model("Branch", branchSchema);
