const mongoose = require("mongoose");

const pickListItemSchema = new mongoose.Schema({
	productCode: {
		type: String,
		required: true,
	},
	productId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Product",
	},
	productName: {
		type: String,
	},
	barcode: {
		type: String,
	},
	requiredQty: {
		type: Number,
		required: true,
		min: 1,
	},
	pickedQty: {
		type: Number,
		default: 0,
		min: 0,
	},
	rackId: {
		type: String,
	},
	rackSequence: {
		type: Number,
		default: 0,
	},
	itemStatus: {
		type: String,
		enum: ["PENDING", "PICKED", "EXCESS", "PARTIAL"],
		default: "PENDING",
	},
});

const pickListSchema = new mongoose.Schema(
	{
		pickListId: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
		},
		branch: {
			type: String,
			required: true,
		},
		branchId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Branch",
		},
		status: {
			type: String,
			enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
			default: "PENDING",
		},
		items: [pickListItemSchema],
		operator: {
			type: String,
		},
		totalItems: {
			type: Number,
			default: 0,
		},
		pickedItems: {
			type: Number,
			default: 0,
		},
		errorCount: {
			type: Number,
			default: 0,
		},
		startedAt: {
			type: Date,
		},
		completedAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
	},
);

// Auto-sort items by rack sequence
pickListSchema.pre("save", function (next) {
	if (this.items && this.items.length > 0) {
		this.items.sort((a, b) => {
			if (a.rackId !== b.rackId) {
				return (a.rackId || "").localeCompare(b.rackId || "");
			}
			return (a.rackSequence || 0) - (b.rackSequence || 0);
		});
		this.totalItems = this.items.reduce(
			(sum, item) => sum + item.requiredQty,
			0,
		);
		this.pickedItems = this.items.reduce(
			(sum, item) => sum + item.pickedQty,
			0,
		);
	}
	next();
});

// Index for fast queries
pickListSchema.index({ pickListId: 1 });
pickListSchema.index({ branch: 1, status: 1 });
pickListSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PickList", pickListSchema);
