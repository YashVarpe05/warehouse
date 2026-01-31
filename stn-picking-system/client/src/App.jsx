import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Picking from "./pages/Picking";
import Products from "./pages/Products";
import BarcodeGenerator from "./pages/BarcodeGenerator";
import Analytics from "./pages/Analytics";

function App() {
	return (
		<div className="app-container">
			<nav className="navbar">
				<div className="navbar-content">
					<NavLink to="/" className="navbar-brand">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
							<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
							<line x1="12" y1="22.08" x2="12" y2="12" />
						</svg>
						STN Picking
					</NavLink>

					<div className="navbar-nav">
						<NavLink
							to="/"
							className={({ isActive }) =>
								`nav-link ${isActive ? "active" : ""}`
							}
						>
							📊 Dashboard
						</NavLink>
						<NavLink
							to="/picking"
							className={({ isActive }) =>
								`nav-link ${isActive ? "active" : ""}`
							}
						>
							📦 Picking
						</NavLink>
						<NavLink
							to="/products"
							className={({ isActive }) =>
								`nav-link ${isActive ? "active" : ""}`
							}
						>
							🏷️ Products
						</NavLink>
						<NavLink
							to="/barcode"
							className={({ isActive }) =>
								`nav-link ${isActive ? "active" : ""}`
							}
						>
							🔲 Barcodes
						</NavLink>
						<NavLink
							to="/analytics"
							className={({ isActive }) =>
								`nav-link ${isActive ? "active" : ""}`
							}
						>
							📈 Analytics
						</NavLink>
					</div>
				</div>
			</nav>

			<main className="main-content">
				<Routes>
					<Route path="/" element={<Dashboard />} />
					<Route path="/picking" element={<Picking />} />
					<Route path="/picking/:pickListId" element={<Picking />} />
					<Route path="/products" element={<Products />} />
					<Route path="/barcode" element={<BarcodeGenerator />} />
					<Route path="/analytics" element={<Analytics />} />
				</Routes>
			</main>
		</div>
	);
}

export default App;
