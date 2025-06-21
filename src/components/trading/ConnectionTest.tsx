import React, { useState } from "react";
import { useTradingSocket } from "../../hooks/useTradingSocket";

export default function ConnectionTest() {
	const { isConnected, connect, testConnection, error, currentServer } =
		useTradingSocket();
	const [testing, setTesting] = useState(false);
	const [testResult, setTestResult] = useState<string | null>(null);

	const handleTestConnection = async () => {
		setTesting(true);
		setTestResult(null);

		try {
			const result = await testConnection();
			if (result.success) {
				setTestResult(`✅ Server reachable at ${result.url}`);
			} else {
				setTestResult(`❌ Server not reachable: ${result.error}`);
			}
		} catch (err) {
			setTestResult(
				`❌ Test failed: ${
					err instanceof Error ? err.message : "Unknown error"
				}`
			);
		} finally {
			setTesting(false);
		}
	};

	const handleConnect = async () => {
		setTesting(true);
		try {
			const connected = await connect();
			if (connected) {
				setTestResult("✅ Socket connected successfully!");
			} else {
				setTestResult("❌ Socket connection failed");
			}
		} catch (err) {
			setTestResult(
				`❌ Connection error: ${
					err instanceof Error ? err.message : "Unknown error"
				}`
			);
		} finally {
			setTesting(false);
		}
	};

	return (
		<div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
			<h4 className="text-yellow-400 font-medium mb-2">
				🔧 Connection Debug
			</h4>

			<div className="space-y-2 text-sm">
				<div>
					<strong>Status:</strong>
					<span
						className={
							isConnected ? "text-green-400" : "text-red-400"
						}
					>
						{isConnected ? " Connected ✅" : " Disconnected ❌"}
					</span>
				</div>

				<div>
					<strong>Server:</strong>
					<span className="text-gray-300 font-mono text-xs">
						{currentServer}
					</span>
				</div>

				{error && (
					<div>
						<strong>Error:</strong>
						<span className="text-red-400">{error}</span>
					</div>
				)}

				{testResult && (
					<div>
						<strong>Test Result:</strong>
						<span className="text-gray-300">{testResult}</span>
					</div>
				)}
			</div>

			<div className="flex gap-2 mt-3">
				<button
					onClick={handleTestConnection}
					disabled={testing}
					className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs px-3 py-1 rounded"
				>
					{testing ? "Testing..." : "Test Server"}
				</button>

				<button
					onClick={handleConnect}
					disabled={testing || isConnected}
					className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs px-3 py-1 rounded"
				>
					{testing ? "Connecting..." : "Retry Connect"}
				</button>
			</div>

			<div className="mt-2 text-xs text-gray-400">
				💡 If connection fails, the backend server might not be running
				at the configured URL.
			</div>
		</div>
	);
}
