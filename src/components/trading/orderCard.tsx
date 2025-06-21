import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

export default function OrderCard({
	suggestion,
	baseToken,
}: {
	suggestion: any;
	baseToken: any;
}) {
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

	const onAccept = (id: string) => {};

	const onReject = (id: string) => {};
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

				{suggestion.status === "pending" ? (
					<div className="flex space-x-2">
						<button
							onClick={() => onAccept(suggestion.id)}
							className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
						>
							Accept
						</button>
						<button
							onClick={() => onReject(suggestion.id)}
							className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
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
