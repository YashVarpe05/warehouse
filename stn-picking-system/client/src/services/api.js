import axios from "axios";

const API_BASE = "/api";

const api = axios.create({
	baseURL: API_BASE,
	headers: {
		"Content-Type": "application/json",
	},
});

// Products API
export const productAPI = {
	getAll: (params) => api.get("/products", { params }),
	getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
	getById: (id) => api.get(`/products/${id}`),
	create: (data) => api.post("/products", data),
	update: (id, data) => api.put(`/products/${id}`, data),
	getCategories: () => api.get("/products/categories/list"),
};

// Barcode API
export const barcodeAPI = {
	generate: (productCode, barcodeType = "QR") =>
		api.post("/barcodes/generate", { productCode, barcodeType }),
	getUnassigned: () => api.get("/barcodes/unassigned"),
	getByProduct: (productCode) => api.get(`/barcodes/product/${productCode}`),
	markPrinted: (code) => api.post(`/barcodes/${code}/print`),
};

// PickList API
export const picklistAPI = {
	getAll: (params) => api.get("/picklist", { params }),
	getById: (id) => api.get(`/picklist/${id}`),
	getStatus: (id) => api.get(`/picklist/${id}/status`),
	create: (data) => api.post("/picklist", data),
	validateScan: (data) => api.post("/picklist/scan/validate", data),
	removeScan: (pickListId, productCode) =>
		api.delete(`/picklist/${pickListId}/item/${productCode}/scan`),
};

// Analytics API
export const analyticsAPI = {
	getSummary: (params) => api.get("/analytics/summary", { params }),
	getBranchWise: (params) => api.get("/analytics/branch-wise", { params }),
	getProductWise: (params) => api.get("/analytics/product-wise", { params }),
	getDailySummary: (params) => api.get("/analytics/daily-summary", { params }),
	getErrorAnalysis: (params) =>
		api.get("/analytics/error-analysis", { params }),
	getRecentScans: (params) => api.get("/analytics/recent-scans", { params }),
	getCategoryStats: () => api.get("/analytics/category-stats"),
	getBrandStats: (params) => api.get("/analytics/brand-stats", { params }),
};

// Branches API
export const branchAPI = {
	getAll: () => api.get("/branches"),
	create: (data) => api.post("/branches", data),
};

export default api;
