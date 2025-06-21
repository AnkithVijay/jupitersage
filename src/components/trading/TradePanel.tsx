"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import {
	JupiterToken,
	fetchTokenInfo,
	fetchTokenPrice,
	checkTokenSecurity,
} from "../../lib/jupiterApi";

interface TradePanelProps {
	baseToken: JupiterToken;
	quoteToken: JupiterToken | null;
}

export default function TradePanel({ baseToken, quoteToken }: TradePanelProps) {
	const { connected, publicKey } = useWallet();
	const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
	const [orderType, setOrderType] = useState<"market" | "limit">("market");
	const [amount, setAmount] = useState("");
	const [price, setPrice] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [tokenInfo, setTokenInfo] = useState<JupiterToken | null>(null);
	const [currentPrice, setCurrentPrice] = useState<number>(0);
	const [solBalance, setSolBalance] = useState(0);
	const [quoteTokenBalance, setQuoteTokenBalance] = useState(0);

	// Fetch token information when quoteToken changes
	useEffect(() => {
		if (quoteToken) {
			fetchTokenInfo(quoteToken.address).then(setTokenInfo);
			fetchTokenPrice(quoteToken.address).then((price) => {
				if (price) setCurrentPrice(price);
			});
		}
	}, [quoteToken]);

	// Mock balance fetching - in production, use actual wallet balance APIs
	useEffect(() => {
		if (connected && publicKey) {
			// Mock balances - replace with actual balance checking
			setSolBalance(2.5);
			setQuoteTokenBalance(1000);
		}
	}, [connected, publicKey]);

	const handleTrade = async () => {
		if (!connected || !quoteToken || !amount) return;

		setIsLoading(true);
		try {
			// Enhanced trade object with token information
			const tradeData = {
				type: tradeType,
				orderType,
				amount: parseFloat(amount),
				price: orderType === "limit" ? parseFloat(price) : currentPrice,
				inputToken: tradeType === "buy" ? baseToken : quoteToken,
				outputToken: tradeType === "buy" ? quoteToken : baseToken,
				tokenInfo: tokenInfo,
				wallet: publicKey?.toString(),
				timestamp: new Date().toISOString(),
			};

			await new Promise((resolve) => setTimeout(resolve, 2000));

			setAmount("");
			setPrice("");
		} catch (error) {
			console.error("Error processing trade:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const calculateTotal = () => {
		if (!amount) return "0";
		const priceToUse =
			orderType === "market" ? currentPrice : parseFloat(price) || 0;
		return (parseFloat(amount) * priceToUse).toFixed(4);
	};

	const getEstimatedFee = () => {
		const total = parseFloat(calculateTotal()) || 0;
		return (total * 0.001).toFixed(4); // 0.1% fee estimate
	};

	const tokenSecurity = tokenInfo ? checkTokenSecurity(tokenInfo) : null;

	if (!quoteToken) {
		return (
			<div className="h-full flex items-center justify-center text-gray-400">
				<div className="text-center">
					<div className="text-lg font-medium mb-2">Trade Panel</div>
					<div className="text-sm">
						Select a token to start trading
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full p-4 space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Trade</h3>
				<div className="text-right">
					<div className="text-sm font-medium">
						{quoteToken.symbol}/SOL
					</div>
					{currentPrice > 0 && (
						<div className="text-xs text-gray-400">
							${currentPrice.toFixed(4)}
						</div>
					)}
				</div>
			</div>

			{/* Token Information Panel */}
			{tokenInfo && (
				<div className="bg-gray-800 rounded-lg p-3 space-y-2">
					<div className="flex items-center space-x-2">
						{tokenInfo.logoURI && (
							<img
								src={tokenInfo.logoURI}
								alt={tokenInfo.symbol}
								className="w-6 h-6 rounded-full"
							/>
						)}
						<div>
							<div className="font-medium">{tokenInfo.name}</div>
							<div className="text-xs text-gray-400">
								{tokenInfo.symbol}
							</div>
						</div>
					</div>

					{tokenInfo.tags && (
						<div className="flex flex-wrap gap-1">
							{tokenInfo.tags.slice(0, 3).map((tag, index) => (
								<span
									key={`${tag}-${index}`}
									className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded"
								>
									{tag}
								</span>
							))}
						</div>
					)}

					{tokenInfo.daily_volume && (
						<div className="text-xs text-gray-400">
							24h Volume: $
							{tokenInfo.daily_volume.toLocaleString()}
						</div>
					)}

					{/* Security indicators */}
					{tokenSecurity && (
						<div className="flex items-center space-x-2 text-xs">
							{tokenSecurity.isVerified && (
								<span className="flex items-center space-x-1">
									<span className="w-2 h-2 bg-green-500 rounded-full"></span>
									<span className="text-green-400">
										Verified
									</span>
								</span>
							)}
							{tokenSecurity.hasNoFreezeAuthority && (
								<span className="flex items-center space-x-1">
									<span className="w-2 h-2 bg-blue-500 rounded-full"></span>
									<span className="text-blue-400">
										No Freeze
									</span>
								</span>
							)}
						</div>
					)}
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Buy/Sell Selector */}
				<div className="space-y-4">
					<div className="grid grid-cols-2 bg-gray-700 rounded-lg p-1">
						<button
							onClick={() => setTradeType("buy")}
							className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
								tradeType === "buy"
									? "bg-green-600 text-white"
									: "text-gray-300 hover:text-white"
							}`}
						>
							Buy {quoteToken.symbol}
						</button>
						<button
							onClick={() => setTradeType("sell")}
							className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
								tradeType === "sell"
									? "bg-red-600 text-white"
									: "text-gray-300 hover:text-white"
							}`}
						>
							Sell {quoteToken.symbol}
						</button>
					</div>

					{/* Order Type */}
					<div className="space-y-2">
						<label className="text-sm text-gray-400">
							Order Type
						</label>
						<select
							value={orderType}
							onChange={(e) =>
								setOrderType(
									e.target.value as "market" | "limit"
								)
							}
							className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
						>
							<option value="market">Market</option>
							<option value="limit">Limit</option>
						</select>
					</div>
				</div>

				{/* Trade Form */}
				<div className="space-y-4">
					{/* Amount */}
					<div className="space-y-2">
						<label className="text-sm text-gray-400">
							Amount (
							{tradeType === "buy" ? "SOL" : quoteToken.symbol})
						</label>
						<div className="relative">
							<input
								type="number"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0.00"
								className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
							/>
							<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
								{tradeType === "buy"
									? "SOL"
									: quoteToken.symbol}
							</div>
						</div>
					</div>

					{/* Price (for limit orders) */}
					{orderType === "limit" && (
						<div className="space-y-2">
							<label className="text-sm text-gray-400">
								Price (SOL)
							</label>
							<input
								type="number"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								placeholder={currentPrice.toFixed(4)}
								className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
							/>
						</div>
					)}

					{/* Total */}
					<div className="space-y-2">
						<label className="text-sm text-gray-400">
							Total (
							{tradeType === "buy" ? quoteToken.symbol : "SOL"})
						</label>
						<div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-300">
							{calculateTotal()}
						</div>
					</div>
				</div>

				{/* Trade Button & Info */}
				<div className="space-y-4">
					<button
						onClick={handleTrade}
						disabled={
							!connected ||
							!amount ||
							isLoading ||
							(orderType === "limit" && !price)
						}
						className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
							!connected
								? "bg-gray-600 text-gray-400 cursor-not-allowed"
								: tradeType === "buy"
								? "bg-green-600 hover:bg-green-700 text-white"
								: "bg-red-600 hover:bg-red-700 text-white"
						} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
					>
						{!connected
							? "Connect Wallet"
							: isLoading
							? "Processing..."
							: `${tradeType === "buy" ? "Buy" : "Sell"} ${
									quoteToken.symbol
							  }`}
					</button>

					{connected && (
						<div className="space-y-2 text-sm text-gray-400">
							<div className="flex justify-between">
								<span>Available SOL:</span>
								<span>{solBalance.toFixed(4)}</span>
							</div>
							<div className="flex justify-between">
								<span>Available {quoteToken.symbol}:</span>
								<span>
									{quoteTokenBalance.toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Est. Fee:</span>
								<span>~{getEstimatedFee()} SOL</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
