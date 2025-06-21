"use client";

import { useWallet } from "@jup-ag/wallet-adapter";
import React from "react";

export default function WalletInfo() {
	const { publicKey, connected, connecting, disconnect } = useWallet();

	if (connecting) {
		return (
			<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
				<p className="text-blue-700 dark:text-blue-300">
					Connecting to wallet...
				</p>
			</div>
		);
	}

	if (!connected || !publicKey) {
		return (
			<div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
				<p className="text-gray-600 dark:text-gray-400">
					No wallet connected
				</p>
			</div>
		);
	}

	const shortAddress = `${publicKey.toString().slice(0, 4)}...${publicKey
		.toString()
		.slice(-4)}`;

	return (
		<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
					Wallet Connected
				</h3>
				<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
					Connected
				</span>
			</div>

			<div className="space-y-2">
				<div>
					<label className="text-sm font-medium text-gray-600 dark:text-gray-400">
						Public Key:
					</label>
					<p className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
						{publicKey.toString()}
					</p>
				</div>

				<div>
					<label className="text-sm font-medium text-gray-600 dark:text-gray-400">
						Short Address:
					</label>
					<p className="text-sm font-mono text-gray-900 dark:text-gray-100">
						{shortAddress}
					</p>
				</div>
			</div>

			<button
				onClick={disconnect}
				className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
			>
				Disconnect Wallet
			</button>
		</div>
	);
}
