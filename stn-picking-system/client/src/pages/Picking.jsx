import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { picklistAPI } from "../services/api";
import ScanFeedback from "../components/ScanFeedback";
import CameraScanner from "../components/CameraScanner";

function Picking() {
	const { pickListId } = useParams();
	const [pickList, setPickList] = useState(null);
	const [pickLists, setPickLists] = useState([]);
	const [selectedPickList, setSelectedPickList] = useState(pickListId || "");
	const [barcode, setBarcode] = useState("");
	const [loading, setLoading] = useState(true);
	const [scanResult, setScanResult] = useState(null);
	const [showCamera, setShowCamera] = useState(false);

	const inputRef = useRef(null);
	const lastScanTime = useRef(0);

	// Load pick lists
	useEffect(() => {
		loadPickLists();
	}, []);

	// Load selected pick list
	useEffect(() => {
		if (selectedPickList) {
			loadPickList(selectedPickList);
		}
	}, [selectedPickList]);

	// Auto-focus input
	useEffect(() => {
		if (!showCamera && inputRef.current) {
			inputRef.current.focus();
		}
	}, [showCamera, scanResult]);

	const loadPickLists = async () => {
		try {
			const res = await picklistAPI.getAll();
			setPickLists(res.data.data || []);
		} catch (error) {
			console.error("Error loading pick lists:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadPickList = async (id) => {
		try {
			const res = await picklistAPI.getById(id);
			setPickList(res.data.data);
		} catch (error) {
			console.error("Error loading pick list:", error);
		}
	};

	const handleScan = useCallback(
		async (scannedCode) => {
			// Debounce rapid scans
			const now = Date.now();
			if (now - lastScanTime.current < 500) return;
			lastScanTime.current = now;

			const code = scannedCode || barcode.trim();
			if (!code) return;

			setBarcode("");

			try {
				const res = await picklistAPI.validateScan({
					scannedCode: code,
					pickListId: selectedPickList || undefined,
					deviceType: showCamera ? "CAMERA" : "USB_SCANNER",
				});

				const result = res.data;
				setScanResult(result);

				// Play sound
				playSound(result.success && result.scanResult === "SUCCESS");

				// Refresh pick list if we have one
				if (selectedPickList) {
					await loadPickList(selectedPickList);
				}

				// Hide feedback after delay
				setTimeout(
					() => {
						setScanResult(null);
						if (inputRef.current) inputRef.current.focus();
					},
					result.success && result.scanResult === "SUCCESS" ? 1500 : 2500,
				);
			} catch (error) {
				console.error("Scan error:", error);
				setScanResult({
					success: false,
					scanResult: "ERROR",
					message: "Scan failed. Please try again.",
				});
				playSound(false);
				setTimeout(() => setScanResult(null), 2500);
			}
		},
		[barcode, selectedPickList, showCamera],
	);

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			handleScan();
		}
	};

	const playSound = (success) => {
		try {
			const audio = new Audio(
				success ? "/sounds/success.mp3" : "/sounds/error.mp3",
			);
			audio.volume = 0.5;
			audio.play().catch(() => {});
		} catch (e) {
			// Fallback: vibrate on mobile
			if (navigator.vibrate) {
				navigator.vibrate(success ? 100 : [100, 50, 100]);
			}
		}
	};

	const handleCameraScan = (code) => {
		setShowCamera(false);
		handleScan(code);
	};

	const getNextItem = () => {
		if (!pickList?.items) return null;
		return pickList.items.find((item) => item.pickedQty < item.requiredQty);
	};

	const nextItem = getNextItem();

	if (loading) {
		return <div className="text-muted">Loading...</div>;
	}

	return (
		<div>
			<h1 className="mb-lg">📦 Picking Station</h1>

			{/* Pick List Selection */}
			<div className="card mb-lg">
				<div className="form-group">
					<label className="form-label">Select Pick List</label>
					<select
						className="form-select"
						value={selectedPickList}
						onChange={(e) => setSelectedPickList(e.target.value)}
					>
						<option value="">-- Select a pick list --</option>
						{pickLists.map((pl) => (
							<option key={pl._id} value={pl.pickListId}>
								{pl.pickListId} - {pl.branch} ({pl.status})
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Scanner Input */}
			<div className="scanner-section">
				<div className="scanner-input-wrapper">
					<input
						ref={inputRef}
						type="text"
						className="scanner-input"
						placeholder="Scan or enter barcode..."
						value={barcode}
						onChange={(e) => setBarcode(e.target.value)}
						onKeyDown={handleKeyDown}
						autoFocus
					/>
					<button className="scan-btn" onClick={() => handleScan()}>
						✓ Scan
					</button>
					<button
						className="camera-btn"
						onClick={() => setShowCamera(true)}
						title="Open Camera Scanner"
					>
						📷
					</button>
				</div>
			</div>

			{/* Next Item Hint */}
			{nextItem && (
				<div
					className="card mb-lg"
					style={{ borderColor: "var(--accent-primary)" }}
				>
					<h3 className="card-title mb-sm">📍 Next Item to Pick</h3>
					<div className="flex items-center justify-between">
						<div>
							<div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
								{nextItem.productName || nextItem.productCode}
							</div>
							<div className="text-muted">
								Rack: {nextItem.rackId || "N/A"} | Barcode:{" "}
								{nextItem.barcode || "N/A"}
							</div>
						</div>
						<div style={{ textAlign: "center" }}>
							<div style={{ fontSize: "2rem", fontWeight: 700 }}>
								{nextItem.pickedQty} / {nextItem.requiredQty}
							</div>
							<div className="text-muted">Picked</div>
						</div>
					</div>
				</div>
			)}

			{/* Pick List Items */}
			{pickList && (
				<div className="card">
					<div className="card-header">
						<h3 className="card-title">
							{pickList.pickListId} - {pickList.branch}
						</h3>
						<span className={`status-badge ${pickList.status?.toLowerCase()}`}>
							{pickList.status}
						</span>
					</div>

					{/* Progress */}
					<div className="mb-md">
						<div className="flex justify-between mb-sm">
							<span className="text-muted">Progress</span>
							<span>
								{pickList.pickedItems || 0} / {pickList.totalItems || 0}
							</span>
						</div>
						<div className="progress-bar">
							<div
								className="progress-fill"
								style={{
									width: `${
										pickList.totalItems > 0
											? (pickList.pickedItems / pickList.totalItems) * 100
											: 0
									}%`,
								}}
							/>
						</div>
					</div>

					{/* Items List */}
					<div>
						{pickList.items?.map((item, idx) => {
							const isComplete = item.pickedQty >= item.requiredQty;
							const isNext = item === nextItem;

							return (
								<div
									key={idx}
									className={`pick-list-item ${isComplete ? "completed" : ""} ${isNext ? "active" : ""}`}
								>
									<div
										style={{
											width: 40,
											height: 40,
											borderRadius: 8,
											background: isComplete
												? "var(--success-bg)"
												: "var(--bg-tertiary)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "1.25rem",
										}}
									>
										{isComplete ? "✅" : "📦"}
									</div>

									<div className="pick-item-info">
										<div className="pick-item-name">
											{item.productName || item.productCode}
										</div>
										<div className="pick-item-meta">
											Rack: {item.rackId || "N/A"} | Barcode:{" "}
											{item.barcode || "N/A"}
										</div>
									</div>

									<div className="pick-item-qty">
										<div className="qty-display">
											<span
												style={{
													color: isComplete ? "var(--success)" : "inherit",
												}}
											>
												{item.pickedQty}
											</span>
											<span className="text-muted"> / {item.requiredQty}</span>
										</div>
										<div className="qty-label">
											<span
												className={`status-badge ${item.itemStatus?.toLowerCase()}`}
											>
												{item.itemStatus}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* No Pick List Selected */}
			{!selectedPickList && (
				<div className="card" style={{ textAlign: "center", padding: "3rem" }}>
					<div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
					<h2>Select a Pick List</h2>
					<p className="text-muted">
						Choose a pick list above to start scanning, or scan any barcode to
						look up product info.
					</p>
				</div>
			)}

			{/* Scan Feedback Overlay */}
			<ScanFeedback result={scanResult} />

			{/* Camera Scanner Modal */}
			{showCamera && (
				<CameraScanner
					onScan={handleCameraScan}
					onClose={() => setShowCamera(false)}
				/>
			)}
		</div>
	);
}

export default Picking;
