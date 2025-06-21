import { io, Socket } from "socket.io-client";

export interface Token {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	logoURI?: string;
}

export interface TradingOrder {
	id: string;
	type: "buy" | "sell";
	price: number;
	size: number;
	filled: number;
	status: "pending" | "completed" | "cancelled";
	timestamp: Date;
	symbol: string;
}

export interface CreateOrderData {
	inputMint: string;
	outputMint: string;
	maker: string;
	payer: string;
	currentPrice: number;
	buyPrice?: number;
	sellPrice?: number;
	takeProfitPrice?: number;
	stopLossPrice?: number;
	amountToSell: number;
	inputDecimals: number;
	outputDecimals: number;
}

export interface OrderResponse {
	success: boolean;
	data?: {
		orders: Array<{
			orderId: string;
			orderType: "BUY" | "SELL" | "TAKE_PROFIT" | "STOP_LOSS";
			jupiterResponse: {
				order: string;
				transaction: string;
				requestId: string;
			};
			calculatedOrder: {
				type: string;
				makingAmount: string;
				takingAmount: string;
				targetPrice: number;
				expectedOutputAmount: number;
				description: string;
			};
		}>;
		calculations: {
			summary: {
				totalOrders: number;
				totalInputAmount: number;
				totalExpectedOutput: number;
				riskRewardRatio?: number;
			};
		};
	};
	orderId?: string;
	error?: string;
}

export interface TradingSuggestion {
	confidence: number;
	action: "BUY" | "SELL";
	entryPrice: number;
	takeProfitPrice: number;
	stopLossPrice: number;
	positionSize: number;
	riskRewardRatio: number;
	reasoning: string;
	timeframe: string;
	riskLevel: string;
}

export interface MarketAnalysis {
	trend: "BULLISH" | "BEARISH" | "NEUTRAL";
	strength: number;
	support: number;
	resistance: number;
	volatility: "LOW" | "MEDIUM" | "HIGH";
}

export interface TechnicalIndicators {
	priceChange: number;
	confidence: "low" | "medium" | "high";
	liquidity: "low" | "medium" | "high";
}

export interface SuggestionsRequest {
	tokenMint: string;
	timeframe: "1min" | "5min" | "15min" | "1h" | "4h" | "1d";
	riskLevel: "conservative" | "moderate" | "aggressive";
	userBalance: number;
	preferences: {
		maxRiskPercentage: number;
		preferredTimeframe: string;
	};
}

export interface SuggestionsResponse {
	success: boolean;
	data?: {
		currentPrice: number;
		suggestions: TradingSuggestion[];
		marketAnalysis: MarketAnalysis;
		technicalIndicators: TechnicalIndicators;
	};
	error?: string;
}

export interface ClientReadyAck {
	success: boolean;
	error?: string;
}

const getPrimaryServerUrl = (): string => {
	return process.env.NEXT_PUBLIC_BACKEND_URL || "http://139.59.43.97:3000";
};

// Build complete server list with primary first, then fallbacks
const SERVER_URLS = [getPrimaryServerUrl()];

export class TradingSocketService {
	private socket: Socket | null = null;
	private isConnected = false;
	private serverUrl = SERVER_URLS[0];
	private connectionAttempts = 0;
	private maxRetries = SERVER_URLS.length;
	private retryDelay = 5000;
	private connectionTimeout = 20000;
	private isReconnecting = false;
	private reconnectInterval: NodeJS.Timeout | null = null;
	private heartbeatInterval: NodeJS.Timeout | null = null;
	private manualDisconnect = false;

	// Enhanced connection management
	private pendingSuggestionsRequests: SuggestionsRequest[] = [];
	private autoConnectEnabled = true;
	private lastSuggestionsRequest: SuggestionsRequest | null = null;
	private connectionRetryCount = 0;
	private maxConnectionRetries = 10;

	// Event listeners
	private onConnectionChange: ((connected: boolean) => void) | null = null;
	private onOrderCreated: ((response: OrderResponse) => void) | null = null;
	private onOrderStatus: ((response: unknown) => void) | null = null;
	private onOrderCancelled: ((response: unknown) => void) | null = null;
	private onError: ((error: string | null) => void) | null = null;
	private onTradingSuggestions:
		| ((response: SuggestionsResponse) => void)
		| null = null;

	constructor(serverUrl?: string) {
		if (serverUrl) {
			this.serverUrl = serverUrl;
		}

		// Auto-connect on initialization
		if (this.autoConnectEnabled) {
			this.autoConnect();
		}

		this.startHeartbeat();
	}

	// Auto-connect method that attempts connection automatically
	private async autoConnect() {
		if (this.manualDisconnect || this.isReconnecting) {
			return;
		}

		console.log("🔄 Auto-connecting to trading socket...");
		try {
			await this.connect();
		} catch (error) {
			console.error("Auto-connect failed:", error);
			this.connectionRetryCount++;

			if (
				this.connectionRetryCount < this.maxConnectionRetries &&
				this.autoConnectEnabled
			) {
				const delay = Math.min(
					this.retryDelay * Math.pow(2, this.connectionRetryCount),
					30000
				);
				console.log(
					`⏰ Retrying auto-connect in ${delay / 1000} seconds...`
				);
				setTimeout(() => this.autoConnect(), delay);
			} else {
				console.error("❌ Max auto-connect retries reached");
				this.onError?.(
					"Failed to auto-connect after multiple attempts"
				);
			}
		}
	}

	private startHeartbeat() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}

		this.heartbeatInterval = setInterval(() => {
			if (this.socket && this.isConnected) {
				console.log("💗 Sending heartbeat ping");
				const pingTimeout = setTimeout(() => {
					console.log("❌ Heartbeat ping timeout");
					this.isConnected = false;
					this.onConnectionChange?.(false);
					if (!this.isReconnecting) {
						this.scheduleReconnect();
					}
				}, 5000);

				this.socket.emit("ping", { timestamp: Date.now() }, () => {
					clearTimeout(pingTimeout);
				});
			}
		}, 15000);
	}

	private clearIntervals() {
		if (this.reconnectInterval) {
			clearInterval(this.reconnectInterval);
			this.reconnectInterval = null;
		}
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}

	async connect(): Promise<boolean> {
		if (this.isReconnecting) {
			console.log("🔄 Connection already in progress, skipping...");
			return false;
		}

		this.isReconnecting = true;
		this.manualDisconnect = false;

		return new Promise((resolve) => {
			this.connectionAttempts++;
			console.log(
				`🔄 Attempting connection ${this.connectionAttempts}/${this.maxRetries} to Sage BG server at: ${this.serverUrl}`,
				this.serverUrl === getPrimaryServerUrl()
					? "(Primary Server)"
					: "(Fallback Server)"
			);

			try {
				if (this.socket) {
					this.socket.removeAllListeners();
					this.socket = null;
				}

				this.socket = io(this.serverUrl, {
					timeout: this.connectionTimeout,
					transports: ["websocket", "polling"],
					forceNew: true,
					reconnection: true,
					reconnectionDelay: 2000,
					reconnectionDelayMax: 5000,
					reconnectionAttempts: 10,
					autoConnect: false,
					upgrade: true,
					rememberUpgrade: true,
				});

				this.setupEventListeners(resolve);
				this.socket.connect();
			} catch (error) {
				console.error("Failed to initialize socket connection:", error);
				this.onError?.(`Socket initialization failed: ${error}`);
				this.isReconnecting = false;
				resolve(false);
			}
		});
	}

	private setupEventListeners(resolve: (value: boolean) => void) {
		if (!this.socket) return;

		// Connection successful
		this.socket.on("connect", () => {
			console.log(
				"✅ Connected to Sage BG server at:",
				this.serverUrl,
				this.serverUrl === getPrimaryServerUrl()
					? "(Primary Server)"
					: "(Fallback Server)"
			);
			this.isConnected = true;
			this.connectionAttempts = 0;
			this.connectionRetryCount = 0;
			this.isReconnecting = false;
			this.manualDisconnect = false;
			this.onConnectionChange?.(true);
			this.onError?.(null);
			this.startHeartbeat();

			// Send initial handshake and verify connection
			this.socket?.emit(
				"client_ready",
				{
					clientType: "jupiter_sage_frontend",
					timestamp: Date.now(),
				},
				(ack: ClientReadyAck) => {
					// If we don't get an ack within 5 seconds, consider connection failed
					const ackTimeout = setTimeout(() => {
						console.log("❌ No handshake acknowledgment received");
						this.isConnected = false;
						this.onConnectionChange?.(false);
						this.handleConnectionFailure(resolve);
					}, 5000);

					if (ack?.success) {
						clearTimeout(ackTimeout);
						// Process any pending suggestions requests on connect
						this.processPendingSuggestionsRequests();

						// Re-send last suggestions request if available
						if (this.lastSuggestionsRequest) {
							console.log(
								"🔄 Re-sending last suggestions request on connect"
							);
							setTimeout(() => {
								if (
									this.lastSuggestionsRequest &&
									this.isConnected
								) {
									this.getTradingSuggestions(
										this.lastSuggestionsRequest
									);
								}
							}, 1000); // Small delay to ensure connection is stable
						}
						resolve(true);
					}
				}
			);
		});

		// Handle pong responses
		this.socket.on("pong", (data) => {
			console.log("💗 Received heartbeat pong", data);
			// Update connection state based on successful pong
			if (!this.isConnected) {
				this.isConnected = true;
				this.onConnectionChange?.(true);
			}
		});

		// Connection failed
		this.socket.on("connect_error", (error) => {
			console.error(
				`❌ Connection error to ${this.serverUrl} (${this.connectionAttempts}/${this.maxRetries}):`,
				error.message
			);
			this.isConnected = false;
			this.onConnectionChange?.(false);
			this.handleConnectionFailure(resolve);
		});

		// Enhanced disconnect handling
		this.socket.on("disconnect", (reason) => {
			console.log("❌ Disconnected from Sage BG server. Reason:", reason);
			this.isConnected = false;
			this.onConnectionChange?.(false);

			if (!this.manualDisconnect && this.autoConnectEnabled) {
				if (
					reason === "io server disconnect" ||
					reason === "ping timeout" ||
					reason === "transport close" ||
					reason === "transport error"
				) {
					this.onError?.(
						`Connection lost (${reason}). Reconnecting...`
					);

					// Clear any existing reconnect attempts
					if (this.reconnectInterval) {
						clearTimeout(this.reconnectInterval);
						this.reconnectInterval = null;
					}

					if (!this.isReconnecting) {
						this.scheduleReconnect();
					}
				}
			}
		});

		// Reconnect events
		this.socket.on("reconnect", (attemptNumber) => {
			console.log(
				`✅ Reconnected to Sage BG server (attempt ${attemptNumber})`
			);
			this.isConnected = true;
			this.isReconnecting = false;
			this.connectionRetryCount = 0;
			this.onConnectionChange?.(true);
			this.onError?.(null);
			this.startHeartbeat();

			// Process pending requests on reconnect
			this.processPendingSuggestionsRequests();
		});

		this.socket.on("reconnect_attempt", (attemptNumber) => {
			console.log(`🔄 Reconnection attempt ${attemptNumber}`);
			this.onError?.(`Reconnecting... (attempt ${attemptNumber})`);
		});

		this.socket.on("reconnect_error", (error) => {
			console.error("❌ Reconnection error:", error.message);
		});

		this.socket.on("reconnect_failed", () => {
			console.error("❌ Reconnection failed after all attempts");
			this.isReconnecting = false;
			this.onError?.("Reconnection failed. Trying fallback servers...");
			this.scheduleReconnect();
		});

		// Order event listeners
		this.socket.on("orderCreated", (response: OrderResponse) => {
			console.log("📦 Order created response from Sage BG:", response);
			this.onOrderCreated?.(response);
		});

		this.socket.on("orderStatus", (response) => {
			console.log("📊 Order status from Sage BG:", response);
			this.onOrderStatus?.(response);
		});

		this.socket.on("orderCancelled", (response) => {
			console.log("🚫 Order cancelled by Sage BG:", response);
			this.onOrderCancelled?.(response);
		});

		// Trading suggestions listener
		this.socket.on(
			"tradingSuggestions",
			(response: SuggestionsResponse) => {
				console.log("🤖 Trading suggestions from Sage BG:", response);
				this.onTradingSuggestions?.(response);
			}
		);

		// Handle price check responses
		this.socket.on("priceChecked", (response) => {
			console.log("💰 Price check response:", response);
		});

		// Handle monitoring status responses
		this.socket.on("monitoringStatus", (response) => {
			console.log("📡 Monitoring status:", response);
		});
	}

	private scheduleReconnect() {
		if (this.reconnectInterval) return;

		const delay = Math.min(
			3000 * Math.pow(1.5, this.connectionRetryCount),
			15000
		);
		console.log(`📅 Scheduling reconnection in ${delay / 1000} seconds...`);

		this.reconnectInterval = setTimeout(() => {
			this.reconnectInterval = null;
			if (
				!this.isConnected &&
				!this.manualDisconnect &&
				this.autoConnectEnabled
			) {
				this.connectionRetryCount++;
				this.connect();
			}
		}, delay);
	}

	private handleConnectionFailure(resolve: (value: boolean) => void) {
		if (this.connectionAttempts < this.maxRetries) {
			this.onError?.(
				`Connection failed to ${this.serverUrl}. Trying next server... (${this.connectionAttempts}/${this.maxRetries})`
			);
			this.tryNextServerUrl();
			this.isReconnecting = false;
			setTimeout(() => {
				this.connect().then(resolve);
			}, this.retryDelay);
		} else {
			this.onError?.(
				`Failed to connect to Sage BG server after trying all ${this.maxRetries} URLs. Please ensure the server is running and accessible.`
			);
			this.isReconnecting = false;
			resolve(false);
		}
	}

	private tryNextServerUrl() {
		const currentIndex = SERVER_URLS.indexOf(this.serverUrl);
		const nextIndex = (currentIndex + 1) % SERVER_URLS.length;
		this.serverUrl = SERVER_URLS[nextIndex];
		console.log(`🔄 Trying next Sage BG server URL: ${this.serverUrl}`);
	}

	// Process pending suggestions requests when connection is restored
	private processPendingSuggestionsRequests() {
		if (this.pendingSuggestionsRequests.length > 0) {
			console.log(
				`📤 Processing ${this.pendingSuggestionsRequests.length} pending suggestions requests`
			);

			this.pendingSuggestionsRequests.forEach((request, index) => {
				setTimeout(() => {
					if (this.isConnected && this.socket) {
						console.log(
							"🤖 Sending queued suggestion request:",
							request
						);
						this.socket.emit("getTradingSuggestions", request);
					}
				}, index * 200); // Stagger requests
			});

			this.pendingSuggestionsRequests = [];
		}
	}

	// Enhanced getTradingSuggestions with auto-connect and queuing
	getTradingSuggestions(request: SuggestionsRequest): boolean {
		this.lastSuggestionsRequest = request;

		if (!this.socket || !this.isConnected) {
			console.log(
				"🔄 Not connected, queuing suggestions request and attempting to connect..."
			);

			// Add to queue if not already present
			const isDuplicate = this.pendingSuggestionsRequests.some(
				(req) => JSON.stringify(req) === JSON.stringify(request)
			);

			if (!isDuplicate) {
				this.pendingSuggestionsRequests.push(request);
			}

			// Attempt to connect if not already connecting and auto-connect is enabled
			if (!this.isReconnecting && this.autoConnectEnabled) {
				this.connect().catch((error) => {
					console.error("Failed to connect for suggestions:", error);
					this.onError?.(
						"Failed to connect for suggestions. Retrying..."
					);
				});
			}

			return false;
		}

		console.log("🤖 Requesting trading suggestions:", request);
		this.socket.emit("getTradingSuggestions", request);
		return true;
	}

	// Method to enable/disable auto-connect
	setAutoConnect(enabled: boolean) {
		this.autoConnectEnabled = enabled;
		if (
			enabled &&
			!this.isConnected &&
			!this.isReconnecting &&
			!this.manualDisconnect
		) {
			this.autoConnect();
		}
	}

	// Method to manually trigger suggestions request with promise
	requestSuggestions(request: SuggestionsRequest): Promise<boolean> {
		return new Promise((resolve) => {
			if (this.getTradingSuggestions(request)) {
				resolve(true);
			} else {
				// Set up one-time listener for connection
				const originalListener = this.onConnectionChange;
				this.onConnectionChange = (connected: boolean) => {
					if (connected) {
						// Restore original listener
						this.onConnectionChange = originalListener;
						resolve(this.getTradingSuggestions(request));
					}
				};
				resolve(false);
			}
		});
	}

	// Test connection to server
	async testConnection(): Promise<{
		success: boolean;
		url: string;
		error?: string;
	}> {
		console.log("🧪 Testing connection to Sage BG server:", this.serverUrl);

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(this.serverUrl + "/health", {
				method: "GET",
				signal: controller.signal,
				headers: {
					Accept: "application/json",
				},
			}).finally(() => clearTimeout(timeoutId));

			if (response.ok) {
				return {
					success: true,
					url: this.serverUrl,
				};
			} else {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`
				);
			}
		} catch (error) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 3000);

				await fetch(this.serverUrl, {
					method: "HEAD",
					signal: controller.signal,
					mode: "no-cors",
				}).finally(() => clearTimeout(timeoutId));

				return {
					success: true,
					url: this.serverUrl,
				};
			} catch {
				return {
					success: false,
					url: this.serverUrl,
					error:
						error instanceof Error
							? error.message
							: "Connection failed",
				};
			}
		}
	}

	// Validate minimum order value ($5)
	private validateMinimumOrderValue(orderData: CreateOrderData): boolean {
		const orderValue = orderData.currentPrice * orderData.amountToSell;
		const minimumValue = 5;

		if (orderValue < minimumValue) {
			this.onError?.(
				`Order value ($${orderValue.toFixed(
					2
				)}) is below minimum of $${minimumValue}`
			);
			return false;
		}
		return true;
	}

	// Create buy order
	createBuyOrder(
		baseToken: Token,
		quoteToken: Token,
		currentPrice: number,
		buyPrice: number,
		amountToSpend: number,
		walletAddress: string,
		takeProfitPrice?: number,
		stopLossPrice?: number
	): boolean {
		if (!this.socket || !this.isConnected) {
			this.onError?.("Not connected to server. Please check connection.");
			return false;
		}

		const orderData: CreateOrderData = {
			inputMint: quoteToken.address,
			outputMint: baseToken.address,
			maker: walletAddress,
			payer: walletAddress,
			currentPrice,
			buyPrice,
			takeProfitPrice,
			stopLossPrice,
			amountToSell: amountToSpend,
			inputDecimals: quoteToken.decimals,
			outputDecimals: baseToken.decimals,
		};

		if (
			!this.validateMinimumOrderValue({
				...orderData,
				amountToSell: amountToSpend,
			})
		) {
			return false;
		}

		console.log("Creating buy order:", orderData);
		this.socket.emit("createOrder", orderData);
		return true;
	}

	// Create sell order
	createSellOrder(
		baseToken: Token,
		quoteToken: Token,
		currentPrice: number,
		sellPrice: number,
		amountToSell: number,
		walletAddress: string,
		takeProfitPrice?: number,
		stopLossPrice?: number
	): boolean {
		if (!this.socket || !this.isConnected) {
			this.onError?.("Not connected to server. Please check connection.");
			return false;
		}

		const orderData: CreateOrderData = {
			inputMint: baseToken.address,
			outputMint: quoteToken.address,
			maker: walletAddress,
			payer: walletAddress,
			currentPrice,
			sellPrice,
			takeProfitPrice,
			stopLossPrice,
			amountToSell,
			inputDecimals: baseToken.decimals,
			outputDecimals: quoteToken.decimals,
		};

		if (!this.validateMinimumOrderValue(orderData)) {
			return false;
		}

		console.log("Creating sell order:", orderData);
		this.socket.emit("createOrder", orderData);
		return true;
	}

	// Get order status
	getOrderStatus(orderId: string) {
		if (!this.socket || !this.isConnected) {
			this.onError?.("Not connected to server");
			return;
		}

		this.socket.emit("getOrderStatus", orderId);
	}

	// Cancel order
	cancelOrder(orderId: string) {
		if (!this.socket || !this.isConnected) {
			this.onError?.("Not connected to server");
			return;
		}

		this.socket.emit("cancelOrder", orderId);
	}

	// Enhanced disconnect with auto-connect control
	disconnect(permanent: boolean = false) {
		console.log(
			"👋 Disconnecting from Sage BG server",
			permanent ? "(permanent)" : "(temporary)"
		);

		if (permanent) {
			this.autoConnectEnabled = false;
		}

		this.manualDisconnect = true;
		this.clearIntervals();

		if (this.socket) {
			this.socket.removeAllListeners();
			this.socket.disconnect();
			this.socket = null;
		}

		this.isConnected = false;
		this.connectionAttempts = 0;
		this.connectionRetryCount = 0;
		this.isReconnecting = false;
		this.onConnectionChange?.(false);

		if (permanent) {
			this.pendingSuggestionsRequests = [];
			this.lastSuggestionsRequest = null;
		}
	}

	// Utility methods for managing pending requests
	hasPendingSuggestionsRequests(): boolean {
		return this.pendingSuggestionsRequests.length > 0;
	}

	getPendingRequestsCount(): number {
		return this.pendingSuggestionsRequests.length;
	}

	clearPendingRequests() {
		this.pendingSuggestionsRequests = [];
		this.lastSuggestionsRequest = null;
	}

	// Event listener setters
	setOnConnectionChange(callback: (connected: boolean) => void) {
		this.onConnectionChange = callback;
	}

	setOnOrderCreated(callback: (response: OrderResponse) => void) {
		this.onOrderCreated = callback;
	}

	setOnOrderStatus(callback: (response: unknown) => void) {
		this.onOrderStatus = callback;
	}

	setOnOrderCancelled(callback: (response: unknown) => void) {
		this.onOrderCancelled = callback;
	}

	setOnError(callback: (error: string | null) => void) {
		this.onError = callback;
	}

	setOnTradingSuggestions(callback: (response: SuggestionsResponse) => void) {
		this.onTradingSuggestions = callback;
	}

	// Getters
	getIsConnected(): boolean {
		return this.isConnected;
	}

	getServerUrl(): string {
		return this.serverUrl;
	}

	setServerUrl(url: string) {
		this.serverUrl = url;
		this.connectionAttempts = 0;
		this.connectionRetryCount = 0;
	}

	getAvailableServers(): string[] {
		return [...SERVER_URLS];
	}

	getConnectionAttempts(): number {
		return this.connectionAttempts;
	}

	isAutoConnectEnabled(): boolean {
		return this.autoConnectEnabled;
	}

	getLastSuggestionsRequest(): SuggestionsRequest | null {
		return this.lastSuggestionsRequest;
	}
}

// Singleton instance
export const tradingSocket = new TradingSocketService();
