// Jupiter Token API utility functions and types

export interface JupiterToken {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	logoURI?: string;
	tags?: string[];
	daily_volume?: number;
	created_at?: string;
	freeze_authority?: string | null;
	mint_authority?: string | null;
	permanent_delegate?: string | null;
	minted_at?: string | null;
	extensions?: {
		coingeckoId?: string;
	};
}

const JUPITER_API_BASE = "https://lite-api.jup.ag/tokens/v1";

/**
 * Fetch detailed information for a specific token by mint address
 * @param mintAddress - The token mint address
 * @returns Token information or null if not found
 */
export async function fetchTokenInfo(
	mintAddress: string
): Promise<JupiterToken | null> {
	try {
		const response = await fetch(
			`${JUPITER_API_BASE}/token/${mintAddress}`
		);
		if (!response.ok) return null;
		return await response.json();
	} catch (error) {
		console.error("Error fetching token info:", error);
		return null;
	}
}

/**
 * Fetch a list of verified tokens
 * @param limit - Maximum number of tokens to return (default: 100)
 * @returns Array of verified tokens
 */
export async function fetchVerifiedTokens(
	limit: number = 100
): Promise<JupiterToken[]> {
	try {
		const response = await fetch(`${JUPITER_API_BASE}/tagged/verified`);
		if (!response.ok) return [];
		const tokens = await response.json();
		return tokens.slice(0, limit);
	} catch (error) {
		console.error("Error fetching verified tokens:", error);
		return [];
	}
}

/**
 * Fetch a list of all tradable token mint addresses
 * @returns Array of mint addresses
 */
export async function fetchTradableTokens(): Promise<string[]> {
	try {
		const response = await fetch(`${JUPITER_API_BASE}/mints/tradable`);
		if (!response.ok) return [];
		return await response.json();
	} catch (error) {
		console.error("Error fetching tradable tokens:", error);
		return [];
	}
}

/**
 * Fetch tokens by specific tags
 * @param tags - Array of tags to filter by (e.g., ['verified', 'lst'])
 * @param limit - Maximum number of tokens to return
 * @returns Array of tagged tokens
 */
export async function fetchTokensByTags(
	tags: string[],
	limit: number = 50
): Promise<JupiterToken[]> {
	try {
		const tagString = tags.join(",");
		const response = await fetch(`${JUPITER_API_BASE}/tagged/${tagString}`);
		if (!response.ok) return [];
		const tokens = await response.json();
		return tokens.slice(0, limit);
	} catch (error) {
		console.error("Error fetching tokens by tags:", error);
		return [];
	}
}

/**
 * Fetch the newest tokens
 * @param limit - Maximum number of tokens to return
 * @param offset - Number of tokens to skip
 * @returns Array of new tokens
 */
export async function fetchNewTokens(
	limit: number = 20,
	offset: number = 0
): Promise<JupiterToken[]> {
	try {
		const response = await fetch(
			`${JUPITER_API_BASE}/new?limit=${limit}&offset=${offset}`
		);
		if (!response.ok) return [];
		return await response.json();
	} catch (error) {
		console.error("Error fetching new tokens:", error);
		return [];
	}
}

/**
 * Fetch tokens for a specific market/pool
 * @param marketAddress - The market/pool address
 * @returns Array of token mint addresses in the market
 */
export async function fetchMarketTokens(
	marketAddress: string
): Promise<string[]> {
	try {
		const response = await fetch(
			`${JUPITER_API_BASE}/market/${marketAddress}/mints`
		);
		if (!response.ok) return [];
		return await response.json();
	} catch (error) {
		console.error("Error fetching market tokens:", error);
		return [];
	}
}

/**
 * Mock price fetching function - replace with actual price API
 * In production, you would use Jupiter's Price API or another price feed
 * @param mintAddress - The token mint address
 * @returns Current price in USD or null if not available
 */
export async function fetchTokenPrice(
	mintAddress: string
): Promise<number | null> {
	try {
		// Mock price data - replace with actual price API
		const mockPrices: Record<string, number> = {
			So11111111111111111111111111111111111111112: 100, // SOL
			EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 1, // USDC
			JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: 0.85, // JUP
			DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: 180, // BONK (example)
		};

		return mockPrices[mintAddress] || Math.random() * 10; // Random price for unlisted tokens
	} catch (error) {
		console.error("Error fetching token price:", error);
		return null;
	}
}

/**
 * Check if a token has security concerns
 * @param token - The token to check
 * @returns Object with security flags
 */
export function checkTokenSecurity(token: JupiterToken) {
	return {
		hasNoFreezeAuthority: token.freeze_authority === null,
		hasNoMintAuthority: token.mint_authority === null,
		isVerified: token.tags?.includes("verified") || false,
		isStrict: token.tags?.includes("strict") || false,
		isCommunityVerified: token.tags?.includes("community") || false,
	};
}
