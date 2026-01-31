require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const {
	productRoutes,
	barcodeRoutes,
	picklistRoutes,
	analyticsRoutes,
	branchRoutes,
	importRoutes,
} = require("./routes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5173",
		],
		credentials: true,
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV !== "production") {
	app.use((req, res, next) => {
		console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
		next();
	});
}

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/barcodes", barcodeRoutes);
app.use("/api/picklist", picklistRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/import", importRoutes);

// Scan validation route (direct access)
app.post("/api/scan/validate", (req, res, next) => {
	req.url = "/scan/validate";
	picklistRoutes(req, res, next);
});

// Health check
app.get("/api/health", (req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error("Error:", err);
	res.status(err.status || 500).json({
		success: false,
		message: err.message || "Internal server error",
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`
╔══════════════════════════════════════════════════════════╗
║   STN Loose Picking System - API Server                  ║
║   Running on: http://localhost:${PORT}                       ║
║   Environment: ${(process.env.NODE_ENV || "development").padEnd(20)}               ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
