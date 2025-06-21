import React, { useEffect, useState, useCallback } from "react";
import OrderCard from "./orderCard";
import {
	type SuggestionsRequest,
	type TradingSuggestion,
} from "../../lib/tradingSocket";
import { JupiterToken } from "../../lib/jupiterApi";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Button } from "../ui/button";
import { useTradingSocket } from "@/hooks/useTradingSocket";
import { Loader2, RotateCwIcon } from "lucide-react";

interface Token {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	logoURI?: string;
}

interface Suggestion {
	id: string;
	type: "BUY" | "SELL";
	token: Token;
	buyPrice: number;
	sellPrice: number;
	stopLoss: number;
	confidence: number;
	timeframe: string;
	reason: string;
	status: "pending" | "accepted" | "rejected";
	timestamp: Date;
	riskReward: number;
}

interface SuggestionsProps {
	selectedToken: JupiterToken | null;
}

export default function Suggestions({ selectedToken }: SuggestionsProps) {
	const {
		suggestions,
		suggestionsLoading,
		suggestionsError,
		isConnected,
		getTradingSuggestions,
		clearSuggestionsError,
		// currentPrice,
		// marketAnalysis,
	} = useTradingSocket();

	const defaultTokenMint = "So11111111111111111111111111111111111111112";
	const currentTokenMint = selectedToken?.address || defaultTokenMint;

	// const [connectionStatus, setConnectionStatus] =
	// 	useState<string>("Connecting...");
	// const [lastRequestTime, setLastRequestTime] = useState<Date | null>(null);

	const [requestParams, setRequestParams] = useState<SuggestionsRequest>({
		tokenMint: currentTokenMint,
		timeframe: "5min",
		riskLevel: "moderate",
		userBalance: 10,
		preferences: {
			maxRiskPercentage: 5,
			preferredTimeframe: "5min",
		},
	});

	const baseToken: Token = selectedToken
		? {
				address: selectedToken.address,
				symbol: selectedToken.symbol,
				name: selectedToken.name,
				decimals: selectedToken.decimals,
				logoURI: selectedToken.logoURI,
		  }
		: {
				address: defaultTokenMint,
				symbol: "SOL",
				name: "Solana",
				decimals: 9,
		  };

	const convertSuggestion = (
		suggestion: TradingSuggestion,
		index: number
	): Suggestion => {
		return {
			id: `suggestion-${index}`,
			type: suggestion.action,
			token: baseToken,
			buyPrice: suggestion.action === "BUY" ? suggestion.entryPrice : 0,
			sellPrice:
				suggestion.action === "SELL"
					? suggestion.entryPrice
					: suggestion.takeProfitPrice,
			stopLoss: suggestion.stopLossPrice,
			confidence: Math.round(suggestion.confidence * 100),
			timeframe: "5min",
			reason: suggestion.reasoning,
			status: "pending",
			timestamp: new Date(),
			riskReward: suggestion.riskRewardRatio,
		};
	};

	const requestSuggestions = useCallback(
		(params: SuggestionsRequest) => {
			// setLastRequestTime(new Date());

			const success = getTradingSuggestions(params);

			if (!success) {
				// setConnectionStatus("Connecting and queuing request...");
			} else {
				// setConnectionStatus("Request sent");
			}
		},
		[getTradingSuggestions]
	);

	useEffect(() => {
		if (isConnected) {
			// setConnectionStatus("Connected");
		} else {
			// setConnectionStatus("Reconnecting...");
		}
	}, [isConnected]);

	useEffect(() => {
		const newParams = {
			...requestParams,
			tokenMint: currentTokenMint,
		};
		setRequestParams(newParams);
		requestSuggestions(newParams);
	}, [selectedToken, currentTokenMint, requestSuggestions]);

	useEffect(() => {
		if (!isConnected) return;

		const interval = setInterval(() => {
			requestSuggestions(requestParams);
		}, 60000);

		return () => clearInterval(interval);
	}, [isConnected, requestParams, requestSuggestions]);

	const handleRefresh = () => {
		requestSuggestions(requestParams);
	};

	const handleTimeframeChange = (timeframe: string) => {
		const newParams = {
			...requestParams,
			timeframe: timeframe as
				| "1min"
				| "5min"
				| "15min"
				| "1h"
				| "4h"
				| "1d",
		};
		setRequestParams(newParams);
		requestSuggestions(newParams);
	};

	const handleRiskLevelChange = (riskLevel: string) => {
		const newParams = {
			...requestParams,
			riskLevel: riskLevel as "conservative" | "moderate" | "aggressive",
		};
		setRequestParams(newParams);
		requestSuggestions(newParams);
	};

	const isLoading = suggestionsLoading;
	const isDisabled = suggestionsLoading || !isConnected;

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="p-5.5 border-b border-gray-700 flex-shrink-0 mb-2 flex flex-col gap-2 bg-[#1D2129] rounded-t-lg">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-white">
						AI Suggestions
					</h3>
					<div className="flex items-center gap-2">
						<Select
							value={requestParams.timeframe}
							onValueChange={handleTimeframeChange}
							disabled={isDisabled}
						>
							<SelectTrigger className="w-24 h-7 text-xs">
								<SelectValue placeholder="Timeframe" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1min">1m</SelectItem>
								<SelectItem value="5min">5m</SelectItem>
								<SelectItem value="15min">15m</SelectItem>
								<SelectItem value="1h">1h</SelectItem>
								<SelectItem value="4h">4h</SelectItem>
								<SelectItem value="1d">1d</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={requestParams.riskLevel}
							onValueChange={handleRiskLevelChange}
							disabled={isDisabled}
						>
							<SelectTrigger className="w-24 h-7 text-xs">
								<SelectValue placeholder="Risk Level" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="conservative">
									Conservative
								</SelectItem>
								<SelectItem value="moderate">
									Moderate
								</SelectItem>
								<SelectItem value="aggressive">
									Aggressive
								</SelectItem>
							</SelectContent>
						</Select>

						<Button
							onClick={handleRefresh}
							disabled={isDisabled}
							variant="ghost"
						>
							{suggestionsLoading ? (
								<Loader2 className="w-4 h-4 animate-spin text-[#E9FF9B]" />
							) : (
								<RotateCwIcon className="w-4 h-4 text-[#E9FF9B]" />
							)}
						</Button>
					</div>
				</div>
				{/* <div className="flex items-center gap-4 text-xs">
					<div
						className={`flex items-center gap-1 ${
							isConnected ? "text-[#E9FF9B]" : "text-yellow-400"
						}`}
					>
						<div
							className={`w-2 h-2 rounded-full ${
								isConnected
									? "bg-[#E9FF9B]"
									: "bg-yellow-400 animate-pulse"
							}`}
						></div>
						{connectionStatus}
					</div>

					{currentPrice && (
						<div className="text-gray-400">
							{baseToken.symbol}: ${currentPrice.toFixed(2)}
						</div>
					)}

					{marketAnalysis && (
						<div
							className={`${
								marketAnalysis.trend === "BULLISH"
									? "text-green-400"
									: marketAnalysis.trend === "BEARISH"
									? "text-red-400"
									: "text-yellow-400"
							}`}
						>
							{marketAnalysis.trend} (
							{(marketAnalysis.strength * 100).toFixed(0)}%)
						</div>
					)}

					{lastRequestTime && (
						<div className="text-gray-500 text-xs">
							Last: {lastRequestTime.toLocaleTimeString()}
						</div>
					)}
				</div> */}
			</div>

			<div className="flex-1 overflow-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 h-full">
				<div className="h-[50svh] overflow-y-auto flex flex-col gap-2 p-3 pb-6">
					{isLoading && (
						<>
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={index}
									className="flex items-center justify-center h-32 "
								>
									<div className="w-full h-full bg-[#E9FF9B]/10 rounded-lg animate-pulse"></div>
								</div>
							))}
						</>
					)}

					{suggestionsError && (
						<div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="text-red-400 font-medium">
										Error
									</h4>
									<p className="text-red-300 text-sm mt-1">
										{suggestionsError}
									</p>
								</div>
								<button
									onClick={clearSuggestionsError}
									className="text-red-400 hover:text-red-300 ml-4"
								>
									×
								</button>
							</div>
						</div>
					)}

					{!isLoading &&
						isConnected &&
						suggestions.length === 0 &&
						!suggestionsError && (
							<div className="flex items-center justify-center h-32">
								<div className="text-center text-gray-400">
									<div className="text-2xl mb-2">🤖</div>
									<p>No suggestions available</p>
									<p className="text-sm mt-1">
										Try refreshing or changing parameters
									</p>
								</div>
							</div>
						)}

					{suggestions.length > 0 &&
						suggestions.map((suggestion, index) => (
							<OrderCard
								key={`suggestion-${index}`}
								suggestion={convertSuggestion(
									suggestion,
									index
								)}
								baseToken={baseToken}
							/>
						))}
				</div>
			</div>
		</div>
	);
}
