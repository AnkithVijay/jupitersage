"use client";

import { useEffect, useRef, useState } from "react";
import {
	createChart,
	ColorType,
	IChartApi,
	ISeriesApi,
} from "lightweight-charts";

interface Token {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	logoURI?: string;
}

interface TradingChartProps {
	baseToken: Token;
	quoteToken: Token | null;
}

interface PriceData {
	time: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export default function TradingChart({
	baseToken,
	quoteToken,
}: TradingChartProps) {
	const chartContainerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
	const [timeframe, setTimeframe] = useState("1H");
	const [priceData, setPriceData] = useState<PriceData[]>([]);
	const [currentPrice, setCurrentPrice] = useState<number | null>(null);
	const [priceChange, setPriceChange] = useState<number>(0);

	useEffect(() => {
		if (!chartContainerRef.current) return;

		try {
			const chart = createChart(chartContainerRef.current, {
				layout: {
					background: { type: ColorType.Solid, color: "#1f2937" },
					textColor: "#d1d5db",
				},
				width: chartContainerRef.current.clientWidth,
				height: chartContainerRef.current.clientHeight - 60,
				grid: {
					vertLines: { color: "#374151" },
					horzLines: { color: "#374151" },
				},
				crosshair: {
					mode: 1,
				},
				rightPriceScale: {
					borderColor: "#374151",
				},
				timeScale: {
					borderColor: "#374151",
					timeVisible: true,
					secondsVisible: false,
				},
			});

			// Check if addCandlestickSeries exists before calling it
			if (typeof chart.addSeries === "function") {
				const candlestickSeries = chart.addSeries(
					"Candlestick" as any,
					{
						upColor: "#10b981",
						downColor: "#ef4444",
						borderDownColor: "#ef4444",
						borderUpColor: "#10b981",
						wickDownColor: "#ef4444",
						wickUpColor: "#10b981",
					}
				);
				candlestickSeriesRef.current = candlestickSeries;
			} else {
				console.error("Failed to add candlestick series");
			}

			chartRef.current = chart;

			// Handle resize
			const handleResize = () => {
				if (chartContainerRef.current && chart) {
					chart.applyOptions({
						width: chartContainerRef.current.clientWidth,
						height: chartContainerRef.current.clientHeight - 60,
					});
				}
			};

			window.addEventListener("resize", handleResize);

			return () => {
				window.removeEventListener("resize", handleResize);
				chart.remove();
			};
		} catch (error) {
			console.error("Error initializing chart:", error);
		}
	}, []);

	useEffect(() => {
		if (quoteToken && baseToken) {
			fetchPriceData();
		}
	}, [quoteToken, baseToken, timeframe]);

	useEffect(() => {
		if (candlestickSeriesRef.current && priceData.length > 0) {
			const chartData = priceData.map((item) => ({
				time: new Date(item.time).getTime() / 1000,
				open: item.open,
				high: item.high,
				low: item.low,
				close: item.close,
			}));

			candlestickSeriesRef.current.setData(chartData);

			if (priceData.length > 0) {
				const latest = priceData[priceData.length - 1];
				const previous = priceData[priceData.length - 2];
				setCurrentPrice(latest.close);
				if (previous) {
					setPriceChange(
						((latest.close - previous.close) / previous.close) * 100
					);
				}
			}
		}
	}, [priceData]);

	const fetchPriceData = async () => {
		if (!quoteToken) return;

		try {
			// Generate mock data for now - in production, use real price API
			const mockData: PriceData[] = [];
			const now = Date.now();
			const timeframeMs =
				timeframe === "1H"
					? 3600000
					: timeframe === "4H"
					? 14400000
					: 86400000;

			for (let i = 100; i >= 0; i--) {
				const time = new Date(now - i * timeframeMs).toISOString();
				const basePrice = 100 + Math.sin(i * 0.1) * 10;
				const volatility = Math.random() * 5;

				mockData.push({
					time,
					open: basePrice + (Math.random() - 0.5) * volatility,
					high: basePrice + Math.random() * volatility,
					low: basePrice - Math.random() * volatility,
					close: basePrice + (Math.random() - 0.5) * volatility,
					volume: Math.random() * 1000000,
				});
			}

			setPriceData(mockData);
		} catch (error) {
			console.error("Error fetching price data:", error);
		}
	};

	const timeframes = ["1H", "4H", "1D"];

	return (
		<div className="h-full flex flex-col">
			{/* Chart Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-700">
				<div className="flex items-center space-x-4">
					<h3 className="text-lg font-semibold">
						{quoteToken
							? `${quoteToken.symbol}/SOL`
							: "Select a token"}
					</h3>

					{currentPrice && (
						<div className="flex items-center space-x-2">
							<span className="text-xl font-bold">
								${currentPrice.toFixed(4)}
							</span>
							<span
								className={`text-sm ${
									priceChange >= 0
										? "text-green-400"
										: "text-red-400"
								}`}
							>
								{priceChange >= 0 ? "+" : ""}
								{priceChange.toFixed(2)}%
							</span>
						</div>
					)}
				</div>

				<div className="flex space-x-1">
					{timeframes.map((tf) => (
						<button
							key={tf}
							onClick={() => setTimeframe(tf)}
							className={`px-3 py-1 text-sm rounded ${
								timeframe === tf
									? "bg-purple-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							}`}
						>
							{tf}
						</button>
					))}
				</div>
			</div>

			{/* Chart Container */}
			<div className="flex-1" ref={chartContainerRef} />
		</div>
	);
}
