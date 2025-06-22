import { TrendingDown, TrendingUp } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { useTradingSocket } from "../../hooks/useTradingSocket";
import { Transaction } from "@solana/web3.js";

export default function OrderCard({
	suggestion,
	baseToken,
}: {
	suggestion: any;
	baseToken: any;
}) {
	const { publicKey, connected, signTransaction } = useWallet();
	const {
		createBuyOrder,
		createSellOrder,
		setOrderExecutionCallback,
		clearOrderExecutionCallback,
	} = useTradingSocket();
	const [isExecuting, setIsExecuting] = useState(false);
	const [executionStatus, setExecutionStatus] = useState<string | null>(null);
	const [pendingOrders, setPendingOrders] = useState<any[]>([]);

	const formatPrice = (price: number) => {
		if (price < 0.01) {
			return price.toFixed(8);
		}
		return price.toFixed(4);
	};

	const formatTimeAgo = (timestamp: Date) => {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ago`;
		}
		return `${minutes}m ago`;
	};

	// Set up order execution callback
	useEffect(() => {
		const handleOrderCreated = async (response: any) => {
			if (response.success && response.data) {
				const { orders: createdOrders } = response.data;

				console.log(
					`📊 Created ${createdOrders.length} orders:`,
					createdOrders
				);

				// Store pending orders for execution
				setPendingOrders(createdOrders);
				setExecutionStatus("Orders created, executing...");

				// Execute each order
				let successfulExecutions = 0;
				for (const order of createdOrders) {
					try {
						await executeOrder(
							order.jupiterResponse.transaction,
							order.jupiterResponse.requestId
						);
						successfulExecutions++;
					} catch (error) {
						console.error(
							`Failed to execute ${order.orderType} order:`,
							error
						);
					}
				}

				// Update suggestion status and execution status
				if (successfulExecutions === createdOrders.length) {
					suggestion.status = "accepted";
					setExecutionStatus(
						`All ${createdOrders.length} orders executed successfully`
					);
				} else {
					setExecutionStatus(
						`${successfulExecutions}/${createdOrders.length} orders executed successfully`
					);
				}
			} else {
				console.error("❌ Order creation failed:", response.error);
				setExecutionStatus(
					`Failed: ${response.error || "Unknown error"}`
				);
			}
			setIsExecuting(false);
		};

		// Set the callback when component mounts
		setOrderExecutionCallback(handleOrderCreated);

		return () => {
			// Clear the callback when component unmounts
			clearOrderExecutionCallback();
		};
	}, [setOrderExecutionCallback, clearOrderExecutionCallback, suggestion]);

	const executeOrder = async (transaction: string, requestId: string) => {
		try {
			if (!signTransaction) {
				throw new Error("Wallet does not support transaction signing");
			}

			// Deserialize the transaction
			const transactionBuffer = Buffer.from(transaction, "base64");
			const deserializedTransaction = Transaction.from(transactionBuffer);

			// Sign the transaction with user's wallet
			const signedTransaction = await signTransaction(
				deserializedTransaction
			);

			// Serialize the signed transaction
			const serializedTransaction = signedTransaction
				.serialize()
				.toString("base64");

			// Execute via Jupiter API
			const response = await fetch(
				"https://lite-api.jup.ag/trigger/v1/execute",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						signedTransaction: serializedTransaction,
						requestId: requestId,
					}),
				}
			);

			const result = await response.json();

			if (result.signature) {
				console.log(
					"✅ Order executed successfully:",
					result.signature
				);
				return result;
			} else {
				throw new Error(
					"Execution failed: " + (result.error || "Unknown error")
				);
			}
		} catch (error) {
			console.error("❌ Order execution failed:", error);
			throw error;
		}
	};

	const onAccept = async (id: string) => {
		if (!connected || !publicKey) {
			alert("Please connect your wallet first");
			return;
		}

		setIsExecuting(true);
		setExecutionStatus("Creating order...");

		try {
			// Create USDC token object
			const usdcToken = {
				address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
				symbol: "USDC",
				name: "USD Coin",
				decimals: 6,
			};

			// Create order using the trading socket
			const success =
				suggestion.type === "BUY"
					? createBuyOrder(
							baseToken,
							usdcToken,
							suggestion.buyPrice,
							suggestion.buyPrice,
							1, // amount to spend
							publicKey.toString(),
							suggestion.sellPrice, // take profit
							suggestion.stopLoss // stop loss
					  )
					: createSellOrder(
							baseToken,
							usdcToken,
							suggestion.sellPrice,
							suggestion.sellPrice,
							1, // amount to sell
							publicKey.toString(),
							suggestion.buyPrice, // take profit
							suggestion.stopLoss // stop loss
					  );

			if (!success) {
				throw new Error("Failed to create order");
			}

			// The callback will handle the rest (execution and status updates)
			console.log("✅ Order creation initiated successfully");

		} catch (error) {
			console.error("❌ Order creation failed:", error);
			setExecutionStatus(
				`Failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
			setIsExecuting(false);
		}
	};

	const onReject = (id: string) => {
		suggestion.status = "rejected";
	};

	return (
		<div>
			<div
				key={suggestion.id}
				className="bg-gray-850 rounded-lg p-4 border border-gray-700"
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center space-x-3">
						{suggestion.type === "BUY" ? (
							<TrendingUp className="w-5 h-5 text-green-400" />
						) : (
							<TrendingDown className="w-5 h-5 text-red-400" />
						)}
						<span className="text-white font-medium">
							{suggestion.token.symbol}/{baseToken.symbol}
						</span>
					</div>
					<span className="text-sm text-gray-400">
						{formatTimeAgo(suggestion.timestamp)}
					</span>
				</div>

				{/* Prices */}
				<div className="grid grid-cols-3 gap-4 mb-4 text-sm">
					<div>
						<div className="text-gray-400 mb-1">
							{suggestion.type === "BUY" ? "Buy at" : "Sell at"}
						</div>
						<div className="font-medium">
							{formatPrice(
								suggestion.type === "BUY"
									? suggestion.buyPrice
									: suggestion.sellPrice
							)}
						</div>
					</div>
					<div>
						<div className="text-gray-400 mb-1">Target</div>
						<div className="font-medium">
							{formatPrice(
								suggestion.type === "BUY"
									? suggestion.sellPrice
									: suggestion.buyPrice
							)}
						</div>
					</div>
					<div>
						<div className="text-gray-400 mb-1">Stop Loss</div>
						<div className="font-medium">
							{formatPrice(suggestion.stopLoss)}
						</div>
					</div>
				</div>

				{/* Execution Status */}
				{executionStatus && (
					<div className="mb-4 text-sm">
						<div className="text-gray-400 mb-1">Status</div>
						<div
							className={`font-medium ${
								executionStatus.includes("Failed")
									? "text-red-400"
									: executionStatus.includes("Executed")
									? "text-green-400"
									: "text-yellow-400"
							}`}
						>
							{executionStatus}
						</div>
					</div>
				)}

				{suggestion.status === "pending" ? (
					<div className="flex space-x-2">
						<button
							onClick={() => onAccept(suggestion.id)}
							disabled={isExecuting || !connected}
							className={`flex-1 py-2 rounded text-sm ${
								isExecuting || !connected
									? "bg-gray-600 cursor-not-allowed"
									: "bg-green-600 hover:bg-green-700"
							}`}
						>
							{isExecuting
								? "Processing..."
								: connected
								? "Accept"
								: "Connect Wallet"}
						</button>
						<button
							onClick={() => onReject(suggestion.id)}
							disabled={isExecuting}
							className={`flex-1 py-2 rounded text-sm ${
								isExecuting
									? "bg-gray-600 cursor-not-allowed"
									: "bg-red-600 hover:bg-red-700"
							}`}
						>
							Reject
						</button>
					</div>
				) : (
					<div
						className={`text-center py-2 rounded text-sm ${
							suggestion.status === "accepted"
								? "bg-green-900/30 text-green-400"
								: "bg-red-900/30 text-red-400"
						}`}
					>
						{suggestion.status === "accepted"
							? "Accepted"
							: "Rejected"}
					</div>
				)}
			</div>
		</div>
	);
}
