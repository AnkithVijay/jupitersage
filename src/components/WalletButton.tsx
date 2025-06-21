"use client";

import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import React from "react";

export default function WalletButton() {
	return (
		<div className="flex items-center justify-center">
			<UnifiedWalletButton />
		</div>
	);
}
