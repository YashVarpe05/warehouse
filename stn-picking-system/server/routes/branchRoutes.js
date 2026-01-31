const express = require("express");
const router = express.Router();
const { Branch } = require("../models");

// GET /api/branches - List all branches
router.get("/", async (req, res) => {
	try {
		const branches = await Branch.find({ isActive: true }).sort({
			branchName: 1,
		});
		res.json({ success: true, data: branches });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// POST /api/branches - Create branch
router.post("/", async (req, res) => {
	try {
		const branch = new Branch(req.body);
		await branch.save();
		res.status(201).json({ success: true, data: branch });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

module.exports = router;
