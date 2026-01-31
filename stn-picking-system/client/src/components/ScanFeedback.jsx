import { useEffect } from "react";

function ScanFeedback({ result }) {
	if (!result) return null;

	const isSuccess = result.success && result.scanResult === "SUCCESS";
	const isWarning = result.scanResult === "EXCESS";
	const isError =
		!result.success ||
		result.scanResult === "NOT_FOUND" ||
		result.scanResult === "NOT_IN_LIST";

	let bgClass = "success";
	let icon = "✅";
	let title = "Scan Successful!";

	if (isWarning) {
		bgClass = "error";
		icon = "⚠️";
		title = "Excess Scan!";
	} else if (isError) {
		bgClass = "error";
		icon = "❌";
		title =
			result.scanResult === "NOT_FOUND" ? "Product Not Found" : "Scan Failed";
	}

	return (
		<div className={`scan-feedback active ${bgClass}`}>
			<div className="scan-feedback-content">
				<div className="scan-feedback-icon">{icon}</div>
				<h2 style={{ marginBottom: "0.5rem" }}>{title}</h2>
				<p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
					{result.message}
				</p>

				{result.product && (
					<div
						style={{
							background: "var(--bg-tertiary)",
							padding: "1rem",
							borderRadius: "8px",
							marginBottom: "1rem",
						}}
					>
						<div style={{ fontWeight: 600 }}>{result.product.productName}</div>
						<div className="text-muted">{result.product.productCode}</div>
						{result.product.rackId && (
							<div className="text-muted">Rack: {result.product.rackId}</div>
						)}
					</div>
				)}

				{result.requiredQty !== undefined && (
					<div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
						<span
							style={{ color: isSuccess ? "var(--success)" : "var(--error)" }}
						>
							{result.pickedQty}
						</span>
						<span className="text-muted"> / {result.requiredQty}</span>
					</div>
				)}

				{result.isComplete && (
					<div
						style={{
							marginTop: "1rem",
							color: "var(--success)",
							fontWeight: 600,
						}}
					>
						✓ Item Complete!
					</div>
				)}

				{result.responseTimeMs && (
					<div
						style={{
							marginTop: "0.5rem",
							fontSize: "0.75rem",
							color: "var(--text-muted)",
						}}
					>
						Response: {result.responseTimeMs}ms
					</div>
				)}
			</div>
		</div>
	);
}

export default ScanFeedback;
