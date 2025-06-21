"use client";

import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import React from "react";

// Notification callbacks for wallet events
const WalletNotification = {
	onConnect: ({
		shortAddress,
		walletName,
	}: {
		shortAddress: string;
		walletName: string;
	}) => {
		console.log(`✅ Connected to ${walletName} (${shortAddress})`);
	},
	onConnecting: ({ walletName }: { walletName: string }) => {
		console.log(`🔄 Connecting to ${walletName}...`);
	},
	onDisconnect: ({
		shortAddress,
		walletName,
	}: {
		shortAddress: string;
		walletName: string;
	}) => {
		console.log(`❌ Disconnected from ${walletName} (${shortAddress})`);
	},
	onNotInstalled: ({ walletName }: { walletName: string }) => {
		console.log(`⚠️ ${walletName} is not installed`);
	},
	onError: ({ error, walletName }: { error: Error; walletName: string }) => {
		console.error(`🚫 Error with ${walletName}:`, error);
	},
};

interface WalletProviderProps {
	children: React.ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
	const endpoint = process.env.NEXT_PUBLIC_RPC_URL || "";

	return (
		<ConnectionProvider endpoint={endpoint}>
			<UnifiedWalletProvider
				wallets={[]}
				config={{
					autoConnect: true,
					env: "mainnet-beta",
					metadata: {
						name: "Jupiter Sage",
						description: "Jupiter Sage - Solana DApp",
						url: "https://jupiter-sage.vercel.app",
						iconUrls: ["/favicon.ico"],
					},
					notificationCallback: WalletNotification,
					walletlistExplanation: {
						href: "https://station.jup.ag/docs/additional-topics/wallet-list",
					},
					theme: "dark",
					lang: "en",
				}}
			>
				{children}
			</UnifiedWalletProvider>
		</ConnectionProvider>
	);
}
