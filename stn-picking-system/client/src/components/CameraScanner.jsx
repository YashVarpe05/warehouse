import { useEffect, useRef, useState } from "react";

function CameraScanner({ onScan, onClose }) {
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const [error, setError] = useState(null);
	const [scanning, setScanning] = useState(false);
	const animationRef = useRef(null);

	useEffect(() => {
		startCamera();
		return () => stopCamera();
	}, []);

	const startCamera = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "environment",
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
			});

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.play();
				setScanning(true);

				// Start scanning after video loads
				videoRef.current.onloadedmetadata = () => {
					scanFrame();
				};
			}
		} catch (err) {
			console.error("Camera error:", err);
			setError("Unable to access camera. Please grant permission.");
		}
	};

	const stopCamera = () => {
		setScanning(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
		if (videoRef.current?.srcObject) {
			videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
		}
	};

	const scanFrame = async () => {
		if (!scanning || !videoRef.current || !canvasRef.current) {
			return;
		}

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");

		if (video.readyState !== video.HAVE_ENOUGH_DATA) {
			animationRef.current = requestAnimationFrame(scanFrame);
			return;
		}

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Try QR scanning with jsQR
		try {
			const jsQR = (await import("jsqr")).default;
			const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
				inversionAttempts: "dontInvert",
			});

			if (qrCode) {
				stopCamera();
				onScan(qrCode.data);
				return;
			}
		} catch (e) {
			console.log("jsQR not ready");
		}

		// Try barcode scanning with quagga
		try {
			const Quagga = (await import("@ericblade/quagga2")).default;

			Quagga.decodeSingle(
				{
					src: canvas.toDataURL(),
					numOfWorkers: 0,
					locate: true,
					decoder: {
						readers: [
							"ean_reader",
							"ean_8_reader",
							"code_128_reader",
							"code_39_reader",
							"upc_reader",
							"upc_e_reader",
						],
					},
				},
				(result) => {
					if (result && result.codeResult) {
						stopCamera();
						onScan(result.codeResult.code);
					}
				},
			);
		} catch (e) {
			console.log("Quagga not ready");
		}

		// Continue scanning
		if (scanning) {
			animationRef.current = requestAnimationFrame(scanFrame);
		}
	};

	return (
		<div className="camera-modal">
			<div className="camera-header">
				<h3>📷 Camera Scanner</h3>
				<button className="btn btn-secondary" onClick={onClose}>
					✕ Close
				</button>
			</div>

			<div className="camera-container">
				{error ? (
					<div style={{ textAlign: "center", padding: "2rem" }}>
						<div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
						<p>{error}</p>
						<button
							className="btn btn-primary"
							onClick={startCamera}
							style={{ marginTop: "1rem" }}
						>
							Retry
						</button>
					</div>
				) : (
					<>
						<video ref={videoRef} className="camera-video" playsInline muted />
						<canvas ref={canvasRef} style={{ display: "none" }} />
						<div className="camera-overlay" />
					</>
				)}
			</div>

			<div
				style={{
					padding: "1rem",
					textAlign: "center",
					color: "var(--text-secondary)",
				}}
			>
				Point camera at barcode or QR code
			</div>
		</div>
	);
}

export default CameraScanner;
