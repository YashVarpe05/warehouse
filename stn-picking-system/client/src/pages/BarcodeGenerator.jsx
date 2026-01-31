import { useState, useEffect } from "react";
import { barcodeAPI, productAPI } from "../services/api";

function BarcodeGenerator() {
	const [products, setProducts] = useState([]);
	const [selectedProduct, setSelectedProduct] = useState("");
	const [barcodeType, setBarcodeType] = useState("QR");
	const [generatedCode, setGeneratedCode] = useState(null);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);

	useEffect(() => {
		loadProductsWithoutBarcodes();
	}, []);

	const loadProductsWithoutBarcodes = async () => {
		try {
			const res = await barcodeAPI.getUnassigned();
			setProducts(res.data.data || []);
		} catch (error) {
			console.error("Error loading products:", error);
			// If API fails, load all products
			try {
				const res = await productAPI.getAll({ hasBarcode: "false" });
				setProducts(res.data.data || []);
			} catch (e) {
				console.error("Fallback failed:", e);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleGenerate = async () => {
		if (!selectedProduct) {
			alert("Please select a product");
			return;
		}

		setGenerating(true);
		try {
			const res = await barcodeAPI.generate(selectedProduct, barcodeType);
			setGeneratedCode(res.data.data);
			loadProductsWithoutBarcodes();
		} catch (error) {
			console.error("Error generating barcode:", error);
			alert("Failed to generate barcode");
		} finally {
			setGenerating(false);
		}
	};

	const handlePrint = () => {
		if (!generatedCode) return;

		const printWindow = window.open("", "_blank");
		printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${generatedCode.productCode}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              margin: 0;
            }
            .barcode-container {
              text-align: center;
              padding: 20px;
              border: 2px dashed #ccc;
              border-radius: 8px;
            }
            .barcode-code {
              font-size: 24px;
              font-weight: bold;
              font-family: monospace;
              margin: 20px 0;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            .product-name {
              font-size: 18px;
              color: #333;
            }
            .product-code {
              font-size: 14px;
              color: #666;
            }
            @media print {
              .barcode-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="barcode-code">${generatedCode.generatedCode}</div>
            <div class="product-name">${generatedCode.productName}</div>
            <div class="product-code">${generatedCode.productCode}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
		printWindow.document.close();
	};

	return (
		<div>
			<h1 className="mb-lg">🔲 Barcode Generator</h1>

			<div className="card mb-lg">
				<h3 className="card-title mb-md">
					Generate Barcode for Products Without Physical Barcode
				</h3>

				<div className="flex gap-md" style={{ flexWrap: "wrap" }}>
					<div className="form-group" style={{ flex: 2, minWidth: "200px" }}>
						<label className="form-label">Select Product</label>
						<select
							className="form-select"
							value={selectedProduct}
							onChange={(e) => setSelectedProduct(e.target.value)}
							disabled={loading}
						>
							<option value="">-- Select a product --</option>
							{products.map((product) => (
								<option key={product._id} value={product.productCode}>
									{product.productCode} - {product.productName}
								</option>
							))}
						</select>
					</div>

					<div className="form-group" style={{ flex: 1, minWidth: "150px" }}>
						<label className="form-label">Barcode Type</label>
						<select
							className="form-select"
							value={barcodeType}
							onChange={(e) => setBarcodeType(e.target.value)}
						>
							<option value="QR">QR Code</option>
							<option value="CODE128">Code 128</option>
							<option value="EAN13">EAN-13</option>
						</select>
					</div>

					<div className="form-group" style={{ alignSelf: "flex-end" }}>
						<button
							className="btn btn-primary btn-lg"
							onClick={handleGenerate}
							disabled={generating || !selectedProduct}
						>
							{generating ? "⏳ Generating..." : "🔲 Generate Barcode"}
						</button>
					</div>
				</div>
			</div>

			{/* Generated Barcode Display */}
			{generatedCode && (
				<div className="card">
					<div className="card-header">
						<h3 className="card-title">Generated Barcode</h3>
						<button className="btn btn-primary" onClick={handlePrint}>
							🖨️ Print
						</button>
					</div>

					<div
						style={{
							textAlign: "center",
							padding: "2rem",
							background: "var(--bg-secondary)",
							borderRadius: "12px",
						}}
					>
						<div
							style={{
								fontSize: "2rem",
								fontFamily: "monospace",
								fontWeight: "bold",
								marginBottom: "1rem",
								padding: "1rem",
								background: "white",
								color: "black",
								borderRadius: "8px",
								display: "inline-block",
							}}
						>
							{generatedCode.generatedCode}
						</div>

						<div style={{ marginTop: "1rem" }}>
							<div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
								{generatedCode.productName}
							</div>
							<div className="text-muted">
								{generatedCode.productCode} | Type: {generatedCode.barcodeType}
							</div>
						</div>
					</div>

					<div
						className="flex gap-md justify-center"
						style={{ marginTop: "1.5rem" }}
					>
						<button className="btn btn-primary" onClick={handlePrint}>
							🖨️ Print Barcode
						</button>
						<button
							className="btn btn-secondary"
							onClick={() => setGeneratedCode(null)}
						>
							Generate Another
						</button>
					</div>
				</div>
			)}

			{/* Products Without Barcodes */}
			<div className="card" style={{ marginTop: "2rem" }}>
				<h3 className="card-title mb-md">Products Without Physical Barcodes</h3>

				{loading ? (
					<div className="text-muted">Loading...</div>
				) : products.length === 0 ? (
					<div style={{ textAlign: "center", padding: "2rem" }}>
						<div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
						<p className="text-muted">All products have barcodes assigned!</p>
					</div>
				) : (
					<div className="table-wrapper">
						<table>
							<thead>
								<tr>
									<th>Product Code</th>
									<th>Name</th>
									<th>Variant</th>
									<th>Rack</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{products.map((product) => (
									<tr key={product._id}>
										<td>
											<strong>{product.productCode}</strong>
										</td>
										<td>{product.productName}</td>
										<td>{product.variant || "-"}</td>
										<td>{product.rackId || "-"}</td>
										<td>
											<button
												className="btn btn-primary"
												onClick={() => setSelectedProduct(product.productCode)}
											>
												Generate
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

export default BarcodeGenerator;
