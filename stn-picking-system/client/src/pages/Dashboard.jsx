import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { analyticsAPI, picklistAPI } from "../services/api";

function Dashboard() {
	const [summary, setSummary] = useState(null);
	const [recentPickLists, setRecentPickLists] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const [summaryRes, pickListsRes] = await Promise.all([
				analyticsAPI.getSummary(),
				picklistAPI.getAll({ limit: 5 }),
			]);
			setSummary(summaryRes.data.data);
			setRecentPickLists(pickListsRes.data.data || []);
		} catch (error) {
			console.error("Error loading dashboard:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <div className="text-muted">Loading dashboard...</div>;
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-lg">
				<h1>Dashboard</h1>
				<button onClick={loadData} className="btn btn-secondary">
					🔄 Refresh
				</button>
			</div>

			{/* Stats Cards */}
			<div className="stats-grid">
				<div className="stat-card">
					<div className="stat-icon total">📦</div>
					<div className="stat-content">
						<div className="stat-value">{summary?.pickLists?.total || 0}</div>
						<div className="stat-label">Today's Pick Lists</div>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon picked">✅</div>
					<div className="stat-content">
						<div className="stat-value">{summary?.items?.picked || 0}</div>
						<div className="stat-label">Items Picked</div>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon pending">⏳</div>
					<div className="stat-content">
						<div className="stat-value">{summary?.items?.pending || 0}</div>
						<div className="stat-label">Pending Items</div>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon error">❌</div>
					<div className="stat-content">
						<div className="stat-value">{summary?.scans?.errors || 0}</div>
						<div className="stat-label">Scan Errors</div>
					</div>
				</div>
			</div>

			{/* Progress */}
			<div className="card mb-lg">
				<div className="card-header">
					<h3 className="card-title">Today's Progress</h3>
					<span className="text-muted">{summary?.items?.progress || 0}%</span>
				</div>
				<div className="progress-bar">
					<div
						className="progress-fill"
						style={{ width: `${summary?.items?.progress || 0}%` }}
					/>
				</div>
				<div
					className="flex justify-between mt-sm text-muted"
					style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}
				>
					<span>{summary?.items?.picked || 0} picked</span>
					<span>{summary?.items?.total || 0} total</span>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="card mb-lg">
				<h3 className="card-title mb-md">Quick Actions</h3>
				<div className="flex gap-md">
					<Link to="/picking" className="btn btn-primary btn-lg">
						📦 Start Picking
					</Link>
					<Link to="/products" className="btn btn-secondary btn-lg">
						🏷️ View Products
					</Link>
					<Link to="/barcode" className="btn btn-secondary btn-lg">
						🔲 Generate Barcode
					</Link>
				</div>
			</div>

			{/* Recent Pick Lists */}
			<div className="card">
				<div className="card-header">
					<h3 className="card-title">Recent Pick Lists</h3>
					<Link to="/picking" className="btn btn-secondary">
						View All
					</Link>
				</div>

				{recentPickLists.length === 0 ? (
					<p className="text-muted">No pick lists found</p>
				) : (
					<div className="table-wrapper">
						<table>
							<thead>
								<tr>
									<th>Pick List ID</th>
									<th>Branch</th>
									<th>Items</th>
									<th>Progress</th>
									<th>Status</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{recentPickLists.map((pl) => {
									const progress =
										pl.totalItems > 0
											? Math.round((pl.pickedItems / pl.totalItems) * 100)
											: 0;
									return (
										<tr key={pl._id}>
											<td>
												<strong>{pl.pickListId}</strong>
											</td>
											<td>{pl.branch}</td>
											<td>
												{pl.pickedItems}/{pl.totalItems}
											</td>
											<td>
												<div
													className="progress-bar"
													style={{ width: "100px" }}
												>
													<div
														className="progress-fill"
														style={{ width: `${progress}%` }}
													/>
												</div>
											</td>
											<td>
												<span
													className={`status-badge ${pl.status?.toLowerCase()}`}
												>
													{pl.status}
												</span>
											</td>
											<td>
												<Link
													to={`/picking/${pl.pickListId}`}
													className="btn btn-primary"
												>
													Continue
												</Link>
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
	);
}

export default Dashboard;
