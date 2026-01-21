// ============ GLOBAL STATE ============
let currentProducts = [];
let editingProductId = null;

// ============ INITIALIZATION ============
document.addEventListener("DOMContentLoaded", function () {
	loadSummary();
	loadProducts();
	setupEventListeners();

	// Auto-focus barcode input
	document.getElementById("barcodeInput").focus();
});

// ============ EVENT LISTENERS ============
function setupEventListeners() {
	// Barcode scanning
	const barcodeInput = document.getElementById("barcodeInput");
	barcodeInput.addEventListener("keypress", function (e) {
		if (e.key === "Enter") {
			processScan();
		}
	});

	document.getElementById("scanBtn").addEventListener("click", processScan);

	// Filters
	document
		.getElementById("categoryFilter")
		.addEventListener("change", loadProducts);
	document
		.getElementById("statusFilter")
		.addEventListener("change", loadProducts);
	document.getElementById("searchBtn").addEventListener("click", loadProducts);
	document
		.getElementById("searchInput")
		.addEventListener("keypress", function (e) {
			if (e.key === "Enter") loadProducts();
		});

	// Refresh button
	document.getElementById("refreshBtn").addEventListener("click", function () {
		loadSummary();
		loadProducts();
	});

	// Close modals on outside click
	document.querySelectorAll(".modal").forEach((modal) => {
		modal.addEventListener("click", function (e) {
			if (e.target === this) {
				this.classList.remove("active");
			}
		});
	});
}

// ============ API CALLS ============
async function loadSummary() {
	try {
		const response = await fetch("/api/summary");
		const data = await response.json();

		document.getElementById("totalProducts").textContent =
			data.total.toLocaleString();
		document.getElementById("scannedProducts").textContent =
			data.scanned.toLocaleString();
		document.getElementById("remainingProducts").textContent =
			data.remaining.toLocaleString();
	} catch (error) {
		console.error("Error loading summary:", error);
	}
}

async function loadProducts() {
	const category = document.getElementById("categoryFilter").value;
	const status = document.getElementById("statusFilter").value;
	const search = document.getElementById("searchInput").value;

	const params = new URLSearchParams();
	if (category) params.append("category", category);
	if (status) params.append("status", status);
	if (search) params.append("search", search);

	try {
		const response = await fetch("/api/products?" + params.toString());
		const products = await response.json();
		currentProducts = products;
		renderTable(products);
	} catch (error) {
		console.error("Error loading products:", error);
		document.getElementById("tableBody").innerHTML =
			'<tr><td colspan="10" class="loading">Error loading products</td></tr>';
	}
}

async function processScan() {
	const input = document.getElementById("barcodeInput");
	const barcode = input.value.trim();

	if (!barcode) {
		showScanStatus("Please enter a barcode", "error");
		return;
	}

	try {
		const response = await fetch("/api/scan", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ barcode: barcode }),
		});

		const result = await response.json();

		if (result.success) {
			if (result.warning) {
				showWarningModal(
					`Barcode: ${result.barcode}\nScanned: ${result.new_count} / Required: ${result.required}`,
				);
				showScanStatus(result.message, "warning");
			} else {
				showScanStatus(
					`✓ ${result.message} (${result.new_count}/${result.required})`,
					"success",
				);
			}

			// Refresh data
			loadSummary();
			loadProducts();
		} else {
			showScanStatus(result.message, "error");
		}

		// Clear and refocus input
		input.value = "";
		input.focus();
	} catch (error) {
		console.error("Error processing scan:", error);
		showScanStatus("Error processing scan", "error");
	}
}

async function removeScan(productId) {
	if (!confirm("Remove one scan from this product?")) return;

	try {
		const response = await fetch(`/api/scan/${productId}`, {
			method: "DELETE",
		});

		const result = await response.json();

		if (result.success) {
			showScanStatus("Scan removed successfully", "success");
			loadSummary();
			loadProducts();
		} else {
			showScanStatus(result.message, "error");
		}
	} catch (error) {
		console.error("Error removing scan:", error);
		showScanStatus("Error removing scan", "error");
	}
}

async function updateProduct(productId, mrp, quantity) {
	try {
		const body = {};
		if (mrp !== undefined) body.mrp = parseFloat(mrp);
		if (quantity !== undefined) body.quantity = parseInt(quantity);

		const response = await fetch(`/api/product/${productId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		const result = await response.json();

		if (result.success) {
			showScanStatus("Product updated successfully", "success");
			loadSummary();
			loadProducts();
			return true;
		} else {
			showScanStatus(result.message, "error");
			return false;
		}
	} catch (error) {
		console.error("Error updating product:", error);
		showScanStatus("Error updating product", "error");
		return false;
	}
}

// ============ TABLE RENDERING ============
function renderTable(products) {
	const tbody = document.getElementById("tableBody");

	if (products.length === 0) {
		tbody.innerHTML =
			'<tr><td colspan="10" class="loading">No products found</td></tr>';
		return;
	}

	tbody.innerHTML = products
		.map((product) => {
			const statusClass = getStatusClass(product.PickingStatus);
			const statusText = getStatusText(product.PickingStatus);

			return `
            <tr>
                <td><strong>${product.BarCode || product.CombiBarCode_MRP || "-"}</strong></td>
                <td>${product.Category || "-"}</td>
                <td>${product.Brand || "-"}</td>
                <td>₹${(product.MRP || 0).toFixed(2)}</td>
                <td>${product.CountOfMRP || 0}</td>
                <td><strong>${product.ScanProducts || 0}</strong></td>
                <td>${product.Conversion || "-"}</td>
                <td>${product.UPC || "-"}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${getStatusIcon(product.PickingStatus)}
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit-mrp" onclick="openMrpModal(${product.ID}, ${product.MRP || 0})">
                            Edit MRP
                        </button>
                        ${
													userRole === "admin"
														? `
                            <button class="btn-action edit-qty" onclick="openQtyModal(${product.ID}, ${product.ScanProducts || 0})">
                                Edit Qty
                            </button>
                        `
														: ""
												}
                        ${
													(product.ScanProducts || 0) > 0
														? `
                            <button class="btn-action remove-scan" onclick="removeScan(${product.ID})">
                                -1
                            </button>
                        `
														: ""
												}
                    </div>
                </td>
            </tr>
        `;
		})
		.join("");
}

function getStatusClass(status) {
	switch (status) {
		case "PICKED":
			return "picked";
		case "EXCESS":
			return "excess";
		default:
			return "pending";
	}
}

function getStatusText(status) {
	switch (status) {
		case "PICKED":
			return "Picked";
		case "EXCESS":
			return "Pick Excess";
		default:
			return "Not Picked";
	}
}

function getStatusIcon(status) {
	switch (status) {
		case "PICKED":
			return "✓";
		case "EXCESS":
			return "⚠";
		default:
			return "○";
	}
}

// ============ UI HELPERS ============
function showScanStatus(message, type) {
	const status = document.getElementById("scanStatus");
	status.textContent = message;
	status.className = "scan-status " + type;

	// Auto-hide after 5 seconds
	setTimeout(() => {
		status.className = "scan-status";
	}, 5000);
}

// ============ MODAL HANDLERS ============
function openMrpModal(productId, currentMrp) {
	editingProductId = productId;
	document.getElementById("editProductId").value = productId;
	document.getElementById("currentMrp").textContent =
		"₹" + (currentMrp || 0).toFixed(2);
	document.getElementById("newMrp").value = "";
	document.getElementById("mrpModal").classList.add("active");
	document.getElementById("newMrp").focus();
}

function closeMrpModal() {
	document.getElementById("mrpModal").classList.remove("active");
	editingProductId = null;
}

async function saveMrp() {
	const newMrp = document.getElementById("newMrp").value;

	if (!newMrp || isNaN(newMrp)) {
		alert("Please enter a valid MRP");
		return;
	}

	const success = await updateProduct(editingProductId, newMrp);
	if (success) {
		closeMrpModal();
	}
}

function openQtyModal(productId, currentQty) {
	editingProductId = productId;
	document.getElementById("editQtyProductId").value = productId;
	document.getElementById("currentQty").textContent = currentQty || 0;
	document.getElementById("newQty").value = "";
	document.getElementById("qtyModal").classList.add("active");
	document.getElementById("newQty").focus();
}

function closeQtyModal() {
	document.getElementById("qtyModal").classList.remove("active");
	editingProductId = null;
}

async function saveQty() {
	const newQty = document.getElementById("newQty").value;

	if (newQty === "" || isNaN(newQty) || parseInt(newQty) < 0) {
		alert("Please enter a valid quantity");
		return;
	}

	const success = await updateProduct(editingProductId, undefined, newQty);
	if (success) {
		closeQtyModal();
	}
}

function showWarningModal(message) {
	document.getElementById("warningMessage").textContent = message;
	document.getElementById("warningModal").classList.add("active");
}

function closeWarningModal() {
	document.getElementById("warningModal").classList.remove("active");
	document.getElementById("barcodeInput").focus();
}
