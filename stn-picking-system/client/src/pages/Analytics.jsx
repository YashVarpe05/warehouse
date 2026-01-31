import { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";

function Analytics() {
	const [summary, setSummary] = useState(null);
	const [branchStats, setBranchStats] = useState([]);
	const [productStats, setProductStats] = useState([]);
	const [dailyStats, setDailyStats] = useState([]);
	const [recentScans, setRecentScans] = useState([]);
	const [categoryStats, setCategoryStats] = useState([]);
	const [brandStats, setBrandStats] = useState([]);
	const [loading, setLoading] = useState(true);
	const [days, setDays] = useState(7);
	const [activeTab, setActiveTab] = useState("overview");

	useEffect(() => {
		loadAnalytics();
	}, [days]);

	const loadAnalytics = async () => {
		setLoading(true);
		try {
			const [
				summaryRes,
				branchRes,
				productRes,
				dailyRes,
				scansRes,
				catRes,
				brandRes,
			] = await Promise.all([
				analyticsAPI.getSummary(),
				analyticsAPI.getBranchWise(),
				analyticsAPI.getProductWise({ limit: 10 }),
				analyticsAPI.getDailySummary({ days }),
				analyticsAPI.getRecentScans({ limit: 30 }),
				analyticsAPI.getCategoryStats(),
				analyticsAPI.getBrandStats({ limit: 10 }),
			]);

			setSummary(summaryRes.data.data);
			setBranchStats(branchRes.data.data || []);
			setProductStats(productRes.data.data || []);
			setDailyStats(dailyRes.data.data || []);
			setRecentScans(scansRes.data.data || []);
			setCategoryStats(catRes.data.data || []);
			setBrandStats(brandRes.data.data || []);
		} catch (error) {
			console.error("Error loading analytics:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatTime = (dateStr) => {
		const date = new Date(dateStr);
		return date.toLocaleTimeString("en-IN", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getScanResultStyle = (result) => {
		switch (result) {
			case "SUCCESS":
				return { bg: "#10b98120", color: "#10b981", icon: "✅" };
			case "PRODUCT_FOUND":
				return { bg: "#3b82f620", color: "#3b82f6", icon: "🔍" };
			case "NOT_FOUND":
				return { bg: "#ef444420", color: "#ef4444", icon: "❌" };
			case "NOT_IN_LIST":
				return { bg: "#f59e0b20", color: "#f59e0b", icon: "⚠️" };
			case "EXCESS":
				return { bg: "#8b5cf620", color: "#8b5cf6", icon: "📦" };
			default:
				return { bg: "#6b728020", color: "#6b7280", icon: "❓" };
		}
	};

	if (loading) {
		return <div className="text-muted">Loading analytics...</div>;
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-lg">
				<h1>📈 Analytics Dashboard</h1>
				<div className="flex gap-sm items-center">
					<label className="text-muted">Period:</label>
					<select
						className="form-select"
						value={days}
						onChange={(e) => setDays(parseInt(e.target.value))}
						style={{ width: "auto" }}
					>
						<option value={7}>Last 7 days</option>
						<option value={14}>Last 14 days</option>
						<option value={30}>Last 30 days</option>
					</select>
					<button className="btn btn-secondary" onClick={loadAnalytics}>
						🔄 Refresh
					</button>
				</div>
			</div>

			{/* Tab Navigation */}
			<div
				className="flex gap-sm mb-lg"
				style={{
					borderBottom: "2px solid var(--border-color)",
					paddingBottom: "0.5rem",
				}}
			>
				{["overview", "products", "scans"].map((tab) => (
					<button
						key={tab}
						className={`btn ${activeTab === tab ? "btn-primary" : "btn-secondary"}`}
						onClick={() => setActiveTab(tab)}
						style={{ textTransform: "capitalize" }}
					>
						{tab === "overview" && "📊 "}
						{tab === "products" && "📦 "}
						{tab === "scans" && "🔍 "}
						{tab}
					</button>
				))}
			</div>

			{/* Overview Tab */}
			{activeTab === "overview" && (
				<>
					{/* Summary Stats */}
					<div className="stats-grid mb-lg">
						<div className="stat-card">
							<div className="stat-icon total">📊</div>
							<div className="stat-content">
								<div className="stat-value">{summary?.scans?.total || 0}</div>
								<div className="stat-label">Total Scans Today</div>
							</div>
						</div>

						<div className="stat-card">
							<div className="stat-icon picked">✅</div>
							<div className="stat-content">
								<div className="stat-value">{summary?.scans?.success || 0}</div>
								<div className="stat-label">Successful Scans</div>
							</div>
						</div>

						<div className="stat-card">
							<div className="stat-icon error">❌</div>
							<div className="stat-content">
								<div className="stat-value">
									{summary?.scans?.errorRate || 0}%
								</div>
								<div className="stat-label">Error Rate</div>
							</div>
						</div>

						<div className="stat-card">
							<div className="stat-icon pending">⚡</div>
							<div className="stat-content">
								<div className="stat-value">
									{summary?.scans?.avgResponseTimeMs || 0}ms
								</div>
								<div className="stat-label">Avg Response Time</div>
							</div>
						</div>
					</div>

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
							gap: "1.5rem",
						}}
					>
						{/* Branch-wise Stats */}
						<div className="card">
							<h3 className="card-title mb-md">📍 Branch Performance</h3>
							{branchStats.length === 0 ? (
								<p className="text-muted">No data available</p>
							) : (
								<div className="table-wrapper">
									<table>
										<thead>
											<tr>
												<th>Branch</th>
												<th>Pick Lists</th>
												<th>Completed</th>
												<th>Items</th>
											</tr>
										</thead>
										<tbody>
											{branchStats.map((stat, idx) => (
												<tr key={idx}>
													<td>
														<strong>{stat._id}</strong>
													</td>
													<td>{stat.totalPickLists}</td>
													<td>
														<span className="text-success">
															{stat.completedPickLists}
														</span>
													</td>
													<td>
														{stat.pickedItems}/{stat.totalItems}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Daily Trend */}
						<div className="card">
							<h3 className="card-title mb-md">📅 Daily Picking Trend</h3>
							{dailyStats.length === 0 ? (
								<p className="text-muted">No data available</p>
							) : (
								<div className="table-wrapper">
									<table>
										<thead>
											<tr>
												<th>Date</th>
												<th>Pick Lists</th>
												<th>Picked</th>
												<th>Completion</th>
											</tr>
										</thead>
										<tbody>
											{dailyStats.map((stat, idx) => {
												const completion =
													stat.totalItems > 0
														? Math.round(
																(stat.pickedItems / stat.totalItems) * 100,
															)
														: 0;
												return (
													<tr key={idx}>
														<td>
															<strong>{stat._id}</strong>
														</td>
														<td>{stat.totalPickLists}</td>
														<td className="text-success">{stat.pickedItems}</td>
														<td>
															<div className="flex items-center gap-sm">
																<div
																	className="progress-bar"
																	style={{ width: "60px" }}
																>
																	<div
																		className="progress-fill"
																		style={{ width: `${completion}%` }}
																	/>
																</div>
																<span>{completion}%</span>
															</div>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				</>
			)}

			{/* Products Tab */}
			{activeTab === "products" && (
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
						gap: "1.5rem",
					}}
				>
					{/* Category Stats */}
					<div className="card">
						<h3 className="card-title mb-md">📂 Category Distribution</h3>
						{categoryStats.length === 0 ? (
							<p className="text-muted">No categories found</p>
						) : (
							<div style={{ maxHeight: "400px", overflowY: "auto" }}>
								{categoryStats.map((cat, idx) => {
									const maxCount = categoryStats[0]?.productCount || 1;
									const width = (cat.productCount / maxCount) * 100;
									return (
										<div key={idx} style={{ marginBottom: "0.75rem" }}>
											<div className="flex justify-between mb-xs">
												<span style={{ fontWeight: 500 }}>
													{cat._id || "Uncategorized"}
												</span>
												<span className="text-muted">
													{cat.productCount} products
												</span>
											</div>
											<div
												style={{
													height: "8px",
													background: "var(--border-color)",
													borderRadius: "4px",
													overflow: "hidden",
												}}
											>
												<div
													style={{
														height: "100%",
														width: `${width}%`,
														background:
															"linear-gradient(90deg, #3b82f6, #8b5cf6)",
														borderRadius: "4px",
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Brand Stats */}
					<div className="card">
						<h3 className="card-title mb-md">🏷️ Top Brands</h3>
						{brandStats.length === 0 ? (
							<p className="text-muted">No brands found</p>
						) : (
							<div className="table-wrapper">
								<table>
									<thead>
										<tr>
											<th>Brand</th>
											<th>Products</th>
											<th>Categories</th>
											<th>Avg MRP</th>
										</tr>
									</thead>
									<tbody>
										{brandStats.map((stat, idx) => (
											<tr key={idx}>
												<td>
													<strong>{stat._id}</strong>
												</td>
												<td>{stat.productCount}</td>
												<td>{stat.categoryCount}</td>
												<td>₹{stat.avgMrp}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{/* Top Products */}
					<div className="card" style={{ gridColumn: "1 / -1" }}>
						<h3 className="card-title mb-md">🏆 Top Picked Products</h3>
						{productStats.length === 0 ? (
							<p className="text-muted">No scan data available</p>
						) : (
							<div className="table-wrapper">
								<table>
									<thead>
										<tr>
											<th>Product</th>
											<th>Category</th>
											<th>Scans</th>
											<th>Avg Time</th>
										</tr>
									</thead>
									<tbody>
										{productStats.map((stat, idx) => (
											<tr key={idx}>
												<td>
													<strong>{stat.productCode}</strong>
													<br />
													<span
														className="text-muted"
														style={{ fontSize: "0.8rem" }}
													>
														{stat.productName}
													</span>
												</td>
												<td>{stat.category || "-"}</td>
												<td>{stat.totalScans}</td>
												<td>{stat.avgResponseTime}ms</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Scans Tab */}
			{activeTab === "scans" && (
				<div className="card">
					<h3 className="card-title mb-md">🔍 Recent Scan Activity</h3>
					{recentScans.length === 0 ? (
						<p className="text-muted">
							No recent scans. Start scanning to see activity here!
						</p>
					) : (
						<div style={{ maxHeight: "600px", overflowY: "auto" }}>
							{recentScans.map((scan, idx) => {
								const style = getScanResultStyle(scan.scanResult);
								return (
									<div
										key={idx}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "1rem",
											padding: "0.75rem",
											marginBottom: "0.5rem",
											background: style.bg,
											borderRadius: "8px",
											borderLeft: `4px solid ${style.color}`,
										}}
									>
										<span style={{ fontSize: "1.5rem" }}>{style.icon}</span>
										<div style={{ flex: 1 }}>
											<div style={{ fontWeight: 600 }}>
												{scan.productName || "Unknown Product"}
											</div>
											<div
												className="text-muted"
												style={{ fontSize: "0.85rem" }}
											>
												{scan.scannedCode} • {scan.brand || "No brand"} •{" "}
												{scan.category || "No category"}
											</div>
										</div>
										<div style={{ textAlign: "right" }}>
											<div
												style={{
													padding: "0.25rem 0.5rem",
													background: style.color,
													color: "white",
													borderRadius: "4px",
													fontSize: "0.75rem",
													fontWeight: 600,
												}}
											>
												{scan.scanResult}
											</div>
											<div
												className="text-muted"
												style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}
											>
												{formatTime(scan.createdAt)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default Analytics;
