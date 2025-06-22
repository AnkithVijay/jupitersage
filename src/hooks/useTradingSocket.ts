import { useState, useEffect, useCallback } from "react";
import {
	tradingSocket,
	type Token,
	type TradingOrder,
	type OrderResponse,
	type SuggestionsRequest,
	type SuggestionsResponse,
	type TradingSuggestion,
	type MarketAnalysis,
	type TechnicalIndicators,
} from "../lib/tradingSocket";

interface UseTradingSocketReturn {
	isConnected: boolean;
	orders: TradingOrder[];
	error: string | null;
	connectionAttempts: number;
	availableServers: string[];
	currentServer: string;
	suggestions: TradingSuggestion[];
	currentPrice: number | null;
	marketAnalysis: MarketAnalysis | null;
	technicalIndicators: TechnicalIndicators | null;
	suggestionsLoading: boolean;
	suggestionsError: string | null;
	connect: () => Promise<boolean>;
	testConnection: () => Promise<{
		success: boolean;
		url: string;
		error?: string;
	}>;
	createBuyOrder: (
		baseToken: Token,
		quoteToken: Token,
		currentPrice: number,
		buyPrice: number,
		amountToSpend: number,
		walletAddress: string,
		takeProfitPrice?: number,
		stopLossPrice?: number
	) => boolean;
	createSellOrder: (
		baseToken: Token,
		quoteToken: Token,
		currentPrice: number,
		sellPrice: number,
		amountToSell: number,
		walletAddress: string,
		takeProfitPrice?: number,
		stopLossPrice?: number
	) => boolean;
	getOrderStatus: (orderId: string) => void;
	cancelOrder: (orderId: string) => void;
	clearError: () => void;
	setServerUrl: (url: string) => void;
	getTradingSuggestions: (request: SuggestionsRequest) => boolean;
	clearSuggestionsError: () => void;
	setOrderExecutionCallback: (
		callback: (response: OrderResponse) => void
	) => void;
	clearOrderExecutionCallback: () => void;
}

export function useTradingSocket(): UseTradingSocketReturn {
	const [isConnected, setIsConnected] = useState(false);
	const [orders, setOrders] = useState<TradingOrder[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [connectionAttempts, setConnectionAttempts] = useState(0);

	const [suggestions, setSuggestions] = useState<TradingSuggestion[]>([]);
	const [currentPrice, setCurrentPrice] = useState<number | null>(null);
	const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(
		null
	);
	const [technicalIndicators, setTechnicalIndicators] =
		useState<TechnicalIndicators | null>(null);
	const [suggestionsLoading, setSuggestionsLoading] = useState(false);
	const [suggestionsError, setSuggestionsError] = useState<string | null>(
		null
	);
	const [orderExecutionCallback, setOrderExecutionCallbackState] = useState<
		((response: OrderResponse) => void) | null
	>(null);

	useEffect(() => {
		// Initialize connection state
		setIsConnected(tradingSocket.getIsConnected());

		tradingSocket.setOnConnectionChange((connected) => {
			console.log("🔌 Connection state changed:", connected);
			setIsConnected(connected);
			setConnectionAttempts(tradingSocket.getConnectionAttempts());
			if (connected && error) {
				setError(null);
			}
		});

		tradingSocket.setOnOrderCreated((response: OrderResponse) => {
			if (response.success && response.data) {
				const newOrders: TradingOrder[] = response.data.orders.map(
					(order, index) => ({
						id: order.orderId,
						type: order.orderType.toLowerCase().includes("buy")
							? "buy"
							: "sell",
						price: order.calculatedOrder.targetPrice,
						size: parseFloat(order.calculatedOrder.makingAmount),
						filled: 0,
						status: "pending",
						timestamp: new Date(),
						symbol: `${order.orderType} Order ${index + 1}`,
					})
				);

				setOrders((prevOrders) => [...prevOrders, ...newOrders]);
				setError(null);

				// Call the order execution callback if set
				if (orderExecutionCallback) {
					orderExecutionCallback(response);
				}
			} else {
				setError(response.error || "Order creation failed");
				// Call the order execution callback with error if set
				if (orderExecutionCallback) {
					orderExecutionCallback(response);
				}
			}
		});

		tradingSocket.setOnOrderStatus((response: unknown) => {
			if (response?.success && response?.data) {
				const updatedOrder = response.data;
				setOrders((prevOrders) =>
					prevOrders.map((order) =>
						order.id === updatedOrder.id
							? {
									...order,
									status:
										updatedOrder.status?.toLowerCase() ||
										order.status,
									filled: updatedOrder.filled || order.filled,
							  }
							: order
					)
				);
			}
		});

		tradingSocket.setOnOrderCancelled((response: unknown) => {
			if (response?.success && response?.orderId) {
				setOrders((prevOrders) =>
					prevOrders.map((order) =>
						order.id === response.orderId
							? { ...order, status: "cancelled" }
							: order
					)
				);
			}
		});

		tradingSocket.setOnTradingSuggestions(
			(response: SuggestionsResponse) => {
				setSuggestionsLoading(false);
				if (response.success && response.data) {
					setSuggestions(response.data.suggestions);
					setCurrentPrice(response.data.currentPrice);
					setMarketAnalysis(response.data.marketAnalysis);
					setTechnicalIndicators(response.data.technicalIndicators);
					setSuggestionsError(null);
				} else {
					setSuggestionsError(
						response.error || "Failed to get suggestions"
					);
				}
			}
		);

		tradingSocket.setOnError((errorMessage) => {
			setError(errorMessage);
			setConnectionAttempts(tradingSocket.getConnectionAttempts());
			setSuggestionsLoading(false);
		});

		const autoConnect = async () => {
			try {
				const connected = await tradingSocket.connect();
				if (!connected) {
					console.log("🔄 Initial connection failed, retrying...");
					setTimeout(() => {
						tradingSocket.connect();
					}, 2000);
				}
			} catch (err) {
				console.error("❌ Auto-connect error:", err);
				setTimeout(() => {
					tradingSocket.connect();
				}, 2000);
			}
		};

		autoConnect();

		// Cleanup function
		return () => {
			// tradingSocket.disconnect(true);
		};
	}, []);

	const connect = useCallback(async (): Promise<boolean> => {
		setError(null);
		try {
			const connected = await tradingSocket.connect();
			if (!connected) {
				setError("Failed to connect to trading server");
			}
			return connected;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Connection failed";
			setError(errorMessage);
			return false;
		}
	}, []);

	const testConnection = useCallback(async () => {
		return await tradingSocket.testConnection();
	}, []);

	const createBuyOrder = useCallback(
		(
			baseToken: Token,
			quoteToken: Token,
			currentPrice: number,
			buyPrice: number,
			amountToSpend: number,
			walletAddress: string,
			takeProfitPrice?: number,
			stopLossPrice?: number
		): boolean => {
			setError(null);
			return tradingSocket.createBuyOrder(
				baseToken,
				quoteToken,
				currentPrice,
				buyPrice,
				amountToSpend,
				walletAddress,
				takeProfitPrice,
				stopLossPrice
			);
		},
		[]
	);

	const createSellOrder = useCallback(
		(
			baseToken: Token,
			quoteToken: Token,
			currentPrice: number,
			sellPrice: number,
			amountToSell: number,
			walletAddress: string,
			takeProfitPrice?: number,
			stopLossPrice?: number
		): boolean => {
			setError(null);
			return tradingSocket.createSellOrder(
				baseToken,
				quoteToken,
				currentPrice,
				sellPrice,
				amountToSell,
				walletAddress,
				takeProfitPrice,
				stopLossPrice
			);
		},
		[]
	);

	const getOrderStatus = useCallback((orderId: string) => {
		tradingSocket.getOrderStatus(orderId);
	}, []);

	const cancelOrder = useCallback((orderId: string) => {
		tradingSocket.cancelOrder(orderId);
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const setServerUrl = useCallback((url: string) => {
		tradingSocket.setServerUrl(url);
		setConnectionAttempts(0);
	}, []);

	const getTradingSuggestions = useCallback(
		(request: SuggestionsRequest): boolean => {
			setSuggestionsLoading(true);
			setSuggestionsError(null);
			const success = tradingSocket.getTradingSuggestions(request);
			if (!success) {
				setSuggestionsLoading(false);
			}
			return success;
		},
		[]
	);

	const clearSuggestionsError = useCallback(() => {
		setSuggestionsError(null);
	}, []);

	const setOrderExecutionCallback = useCallback(
		(callback: (response: OrderResponse) => void) => {
			setOrderExecutionCallbackState(() => callback);
		},
		[]
	);

	const clearOrderExecutionCallback = useCallback(() => {
		setOrderExecutionCallbackState(null);
	}, []);

	return {
		isConnected,
		orders,
		error,
		connectionAttempts,
		availableServers: tradingSocket.getAvailableServers(),
		currentServer: tradingSocket.getServerUrl(),
		suggestions,
		currentPrice,
		marketAnalysis,
		technicalIndicators,
		suggestionsLoading,
		suggestionsError,
		connect,
		testConnection,
		createBuyOrder,
		createSellOrder,
		getOrderStatus,
		cancelOrder,
		clearError,
		setServerUrl,
		getTradingSuggestions,
		clearSuggestionsError,
		setOrderExecutionCallback,
		clearOrderExecutionCallback,
	};
}
