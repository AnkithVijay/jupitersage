"use client";

import TokenSelector from "@/components/trading/TokenSelector";
import WalletButton from "@/components/WalletButton";
import { useState, useEffect } from "react";
import SimpleTradingChart from "@/components/trading/SimpleTradingChart";
import OrderBook from "@/components/trading/OrderBook";
import Suggestions from "@/components/trading/suggestions";
import { JupiterToken } from "@/lib/jupiterApi";

export default function TradingPage() {
	const [selectedToken, setSelectedToken] = useState<JupiterToken | null>(
		null
	);

	// Default Solana token when no token is selected
	const solanaToken: JupiterToken = {
		address: "So11111111111111111111111111111111111111112",
		symbol: "SOL",
		name: "Solana",
		decimals: 9,
		logoURI:
			"https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
		tags: ["verified", "community", "strict"],
		daily_volume: 2873455332.377303,
		created_at: "2024-04-26T10:56:58.893768Z",
		freeze_authority: null,
		mint_authority: null,
		minted_at: null,
		extensions: { coingeckoId: "wrapped-solana" },
	};

	// Set Solana as default selected token on mount
	useEffect(() => {
		if (!selectedToken) {
			setSelectedToken(solanaToken);
		}
	}, []);

	// Get the current token to display (either selected token or Solana as fallback)
	const currentToken = selectedToken || solanaToken;

	return (
		<div className="h-full flex flex-col gap-5 z-20 p-4">
			<header className="flex items-center justify-between p-4 glass">
				<div className="flex items-center space-x-4">
					<h1 className="text-2xl font-semibold text-white">
						Jupiter Sage
					</h1>
					<TokenSelector
						selectedToken={selectedToken}
						onTokenSelect={setSelectedToken}
					/>
				</div>
				<WalletButton />
			</header>

			{/* Main content area with chart and suggestions */}
			<div className="flex-1 grid grid-cols-12 gap-4">
				{/* Chart takes most of the space */}
				<div className="col-span-8 h-full bg-[#1D2129] rounded-lg overflow-hidden">
					<SimpleTradingChart
						baseToken={solanaToken}
						quoteToken={currentToken}
					/>
				</div>

				{/* Suggestions on the right */}
				<div className="col-span-4 h-full">
					<div className="h-full bg-[#1D2129] rounded-lg border border-gray-700">
						<Suggestions selectedToken={selectedToken} />
					</div>
				</div>
			</div>

			{/* OrderBook (Live Orders) at the bottom */}
			<div className="h-80 pt-0 flex-shrink-0">
				<div className="h-full bg-background rounded-lg border border-gray-700 overflow-hidden">
					<OrderBook
						baseToken={solanaToken}
						quoteToken={currentToken}
					/>
				</div>
			</div>
		</div>
	);
}
