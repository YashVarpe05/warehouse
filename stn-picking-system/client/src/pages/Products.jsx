import { useState, useEffect } from "react";
import { productAPI } from "../services/api";

function Products() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [categories, setCategories] = useState([]);

	useEffect(() => {
		loadCategories();
	}, []);

	useEffect(() => {
		loadProducts();
	}, [category]);

	const loadCategories = async () => {
		try {
			const res = await productAPI.getCategories();
			setCategories(res.data.data || []);
		} catch (error) {
			console.error("Error loading categories:", error);
		}
	};

	const loadProducts = async () => {
		setLoading(true);
		try {
			const res = await productAPI.getAll({
				category: category || undefined,
				search: search || undefined,
			});
			setProducts(res.data.data || []);
		} catch (error) {
			console.error("Error loading products:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e) => {
		e.preventDefault();
		loadProducts();
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-lg">
				<h1>🏷️ Products</h1>
				<button className="btn btn-primary">+ Add Product</button>
			</div>

			{/* Filters */}
			<div className="card mb-lg">
				<form
					onSubmit={handleSearch}
					className="flex gap-md"
					style={{ flexWrap: "wrap" }}
				>
					<div
						className="form-group"
						style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}
					>
						<input
							type="text"
							className="form-input"
							placeholder="Search by barcode, name, code..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div
						className="form-group"
						style={{ minWidth: "150px", marginBottom: 0 }}
					>
						<select
							className="form-select"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
						>
							<option value="">All Categories</option>
							{categories.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</select>
					</div>

					<button type="submit" className="btn btn-primary">
						🔍 Search
					</button>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={loadProducts}
					>
						🔄 Refresh
					</button>
				</form>
			</div>

			{/* Products Table */}
			<div className="card">
				{loading ? (
					<div className="text-muted">Loading products...</div>
				) : products.length === 0 ? (
					<div style={{ textAlign: "center", padding: "2rem" }}>
						<div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
						<p className="text-muted">No products found</p>
					</div>
				) : (
					<div className="table-wrapper">
						<table>
							<thead>
								<tr>
									<th>Product Code</th>
									<th>Name</th>
									<th>Variant</th>
									<th>Barcode</th>
									<th>Category</th>
									<th>Rack</th>
									<th>MRP</th>
									<th>Status</th>
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
										<td>
											<code
												style={{
													background: "var(--bg-tertiary)",
													padding: "2px 6px",
													borderRadius: "4px",
													fontSize: "0.8rem",
												}}
											>
												{product.barcode || "No Barcode"}
											</code>
										</td>
										<td>{product.category || "-"}</td>
										<td>
											{product.rackId && (
												<span
													style={{
														background: "var(--accent-gradient)",
														padding: "2px 8px",
														borderRadius: "4px",
														fontSize: "0.8rem",
													}}
												>
													{product.rackId} #{product.rackSequence || 0}
												</span>
											)}
										</td>
										<td>₹{(product.mrp || 0).toFixed(2)}</td>
										<td>
											{product.hasPhysicalBarcode ? (
												<span className="status-badge picked">Has Barcode</span>
											) : (
												<span className="status-badge pending">No Barcode</span>
											)}
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

export default Products;
