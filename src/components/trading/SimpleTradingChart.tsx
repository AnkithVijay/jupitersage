"use client";

import { useEffect, useRef, useState } from "react";
import { JupiterToken } from "../../lib/jupiterApi";
import { Loader2 } from "lucide-react";

interface TradingChartProps {
	baseToken: JupiterToken;
	quoteToken: JupiterToken | null;
}

export default function SimpleTradingChart({ quoteToken }: TradingChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Map token symbols to TradingView symbols
	const getSymbolForToken = (token: JupiterToken | null): string => {
		if (!token) return "SOLUSDT";

		const symbolMap: { [key: string]: string } = {
			SOL: "SOLUSDT",
			JUP: "JUPUSDT",
			BONK: "BONKUSDT",
			WIF: "WIFUSDT",
			RAY: "RAYUSDT",
			USDC: "USDCUSDT",
			USDT: "USDTUSDT",
			ORCA: "ORCAUSDT",
		};

		return (
			symbolMap[token.symbol.toUpperCase()] ||
			`${token.symbol.toUpperCase()}USDT`
		);
	};

	// Get current symbol based on selected token
	const getCurrentSymbol = (): string => {
		return getSymbolForToken(quoteToken);
	};

	// Get display symbol for header
	const getDisplaySymbol = (): string => {
		if (!quoteToken) return "SOL";
		return quoteToken.symbol;
	};

	useEffect(() => {
		if (!containerRef.current) return;

		setIsLoading(true);

		// Clear existing content
		containerRef.current.innerHTML = "";

		// Create TradingView widget
		const script = document.createElement("script");
		script.type = "text/javascript";
		script.src =
			"https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
		script.async = true;

		const symbol = getCurrentSymbol();

		script.innerHTML = JSON.stringify({
			symbols: [[`BINANCE:${symbol}`, symbol]],
			chartOnly: false,
			width: "100%",
			height: "100%",
			locale: "en",
			colorTheme: "dark",
			autosize: true,
			showVolume: false,
			showMA: false,
			hideDateRanges: false,
			hideMarketStatus: false,
			hideSymbolLogo: false,
			scalePosition: "right",
			scaleMode: "Normal",
			fontFamily:
				"-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
			fontSize: "10",
			noTimeScale: false,
			valuesTracking: "1",
			changeMode: "price-and-percent",
			chartType: "area",
			maLineColor: "#E9FF9B",
			maLineWidth: 1,
			maLength: 9,
			backgroundColor: "#1D2129",
			lineWidth: 2,
			lineType: 0,
			dateRanges: [
				"1d|1",
				"1m|30",
				"3m|60",
				"12m|1D",
				"60m|1W",
				"all|1M",
			],
		});

		// Add widget container
		const widgetContainer = document.createElement("div");
		widgetContainer.className = "tradingview-widget-container__widget";
		widgetContainer.style.height = "100%";
		widgetContainer.style.width = "100%";

		const wrapper = document.createElement("div");
		wrapper.className = "tradingview-widget-container";
		wrapper.style.height = "100%";
		wrapper.style.width = "100%";
		wrapper.appendChild(widgetContainer);
		wrapper.appendChild(script);

		containerRef.current.appendChild(wrapper);

		// Hide loading after delay
		setTimeout(() => setIsLoading(false), 2000);

		return () => {
			if (containerRef.current) {
				containerRef.current.innerHTML = "";
			}
		};
	}, [quoteToken]);

	return (
		<div className="h-full flex flex-col bg-[#1D2129] rounded-lg border border-gray-700">
			{/* Chart Header */}
			<div className="flex items-center justify-between p-4 bg-[#1D2129] rounded-lg">
				<div className="flex items-center space-x-3">
					{quoteToken?.logoURI && (
						<img
							src={quoteToken.logoURI}
							alt={quoteToken.symbol}
							className="w-8 h-8 rounded-full"
						/>
					)}
					<div>
						<h3 className="text-lg font-semibold text-white">
							{getDisplaySymbol()}/USDT
						</h3>
						<div className="text-sm text-gray-400">
							{quoteToken?.name || "Solana"}
						</div>
					</div>
					{quoteToken?.tags && (
						<div className="flex space-x-1">
							{quoteToken.tags.slice(0, 2).map((tag, index) => (
								<span
									key={`${tag}-${index}`}
									className="px-2 py-1 bg-[#E9FF9B] text-black/80 text-xs rounded"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>

				{quoteToken?.daily_volume && (
					<div className="text-right">
						<div className="text-sm text-gray-400">24h Volume</div>
						<div className="text-white font-medium">
							${quoteToken.daily_volume.toLocaleString()}
						</div>
					</div>
				)}
			</div>

			{/* Chart Container */}
			<div className="flex-1 relative">
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-[#151E28] z-10">
						<div className="text-gray-400 flex items-center gap-2">
							<Loader2 className="size-8 animate-spin text-[#E9FF9B]" />
						</div>
					</div>
				)}
				<div ref={containerRef} className="h-full w-full" />
			</div>
		</div>
	);
}
