const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(
			process.env.MONGODB_URI || "mongodb://localhost:27017/stn-picking",
		);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`Error: ${error.message}`);
		// For demo mode, don't exit - we'll use in-memory data
		console.log("Running in DEMO MODE - using in-memory data");
	}
};

module.exports = connectDB;
