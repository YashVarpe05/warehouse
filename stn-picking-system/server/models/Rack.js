const mongoose = require("mongoose");

const rackSchema = new mongoose.Schema(
	{
		rackId: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
		},
		zone: {
			type: String,
			trim: true,
		},
		aisle: {
			type: String,
			trim: true,
		},
		level: {
			type: String,
			trim: true,
		},
		sequence: {
			type: Number,
			required: true,
			default: 0,
		},
		branch: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Branch",
		},
		capacity: {
			type: Number,
			default: 100,
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

// Index for sequence-based sorting
rackSchema.index({ branch: 1, sequence: 1 });
rackSchema.index({ zone: 1, sequence: 1 });

module.exports = mongoose.model("Rack", rackSchema);
