"use client";

import { useEffect } from "react";
import OrderCard from "./orderCard";
import { useTradingSocket } from "../../hooks/useTradingSocket";
import { JupiterToken } from "../../lib/jupiterApi";
import { Button } from "../ui/button";

interface OrderBookProps {
	baseToken: JupiterToken;
	quoteToken: JupiterToken | null;
}

interface UserOrder {
	id: string;
	type: "buy" | "sell";
	price: number;
	size: number;
	filled: number;
	status: "pending" | "completed" | "cancelled";
	timestamp: Date;
	symbol: string;
}

export default function OrderBook({ baseToken, quoteToken }: OrderBookProps) {
	const { isConnected, orders, error, connect, cancelOrder, clearError } =
		useTradingSocket();

	useEffect(() => {
		// Auto-connect when component mounts
		if (!isConnected) {
			connect();
		}

		// Cleanup on unmount
		return () => {};
	}, [isConnected, connect]);

	const handleCancelOrder = (orderId: string) => {
		cancelOrder(orderId);
	};

	const handleRetryConnection = () => {
		clearError();
		connect();
	};

	// Convert TradingOrder to UserOrder format for compatibility
	const userOrders: UserOrder[] = orders.map((order) => ({
		id: order.id,
		type: order.type,
		price: order.price,
		size: order.size,
		filled: order.filled,
		status: order.status as "pending" | "completed" | "cancelled",
		timestamp: order.timestamp,
		symbol: order.symbol,
	}));

	return (
		<div className="h-full flex flex-col bg-[#1D2129] rounded-lg border border-gray-700">
			{/* Header with connection status */}
			<div className="flex justify-between items-center p-4 bg-[#1D2129] rounded-t-lg border-b border-gray-700">
				<div className="flex items-center space-x-3">
					<h3 className="text-lg font-semibold text-white">
						Live Orders
					</h3>
					{quoteToken && (
						<div className="flex items-center space-x-2">
							{quoteToken.logoURI && (
								<img
									src={quoteToken.logoURI}
									alt={quoteToken.symbol}
									className="w-5 h-5 rounded-full"
								/>
							)}
							<span className="text-sm text-gray-400">
								{quoteToken.symbol}/SOL
							</span>
						</div>
					)}
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full ${
								isConnected ? "bg-[#E9FF9B]" : "bg-red-500"
							}`}
						/>
						<span className="text-sm text-gray-400">
							{isConnected ? "Connected" : "Disconnected"}
						</span>
					</div>
					{!isConnected && (
						<Button
							onClick={handleRetryConnection}
							className="bg-[#E9FF9B] text-black/80 text-xs px-3 py-1 rounded transition-colors"
						>
							Retry
						</Button>
					)}
				</div>
			</div>

			{/* Error display */}
			{error && (
				<div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
					<div className="flex justify-between items-center">
						<p className="text-red-400 text-sm">{error}</p>
						<Button
							onClick={clearError}
							className="text-red-400 hover:text-red-300"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</Button>
					</div>
				</div>
			)}

			{/* Orders list */}
			<div className="flex-1 overflow-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 h-full">
				<div className="h-full overflow-y-auto space-y-4 p-4">
					{userOrders.length > 0 ? (
						userOrders.map((order) => (
							<div key={order.id} className="relative">
								<OrderCard
									suggestion={order}
									baseToken={baseToken}
								/>
								{/* Cancel button for pending orders */}
								{order.status === "pending" && (
									<button
										onClick={() =>
											handleCancelOrder(order.id)
										}
										className="absolute top-2 right-2 p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors"
										title="Cancel Order"
									>
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								)}
							</div>
						))
					) : (
						<div className="text-center text-[#E9FF9B]/50 mt-8 ">
							<div className="mb-4">
								<svg
									className="w-16 h-16 mx-auto text-[#E9FF9B]/50"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1}
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									/>
								</svg>
							</div>
							<p className="text-lg">No active orders</p>
							<p className="text-sm mt-2">
								{isConnected
									? "Create your first order to get started"
									: "Connect to server to view orders"}
							</p>
							{baseToken && quoteToken && (
								<p className="text-xs text-[#E9FF9B]/50 mt-2">
									Trading pair: {baseToken.symbol}/
									{quoteToken.symbol}
								</p>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Footer with order count */}
			{userOrders.length > 0 && (
				<div className="p-3 border-t border-gray-700 bg-gray-800/50">
					<div className="flex justify-between items-center text-sm text-gray-400">
						<span>Total Orders: {userOrders.length}</span>
						<span>
							Active:{" "}
							{
								userOrders.filter((o) => o.status === "pending")
									.length
							}{" "}
							| Completed:{" "}
							{
								userOrders.filter(
									(o) => o.status === "completed"
								).length
							}{" "}
							| Cancelled:{" "}
							{
								userOrders.filter(
									(o) => o.status === "cancelled"
								).length
							}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
