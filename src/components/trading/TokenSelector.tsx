"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import {
	JupiterToken,
	fetchVerifiedTokens,
	checkTokenSecurity,
} from "../../lib/jupiterApi";

interface TokenSelectorProps {
	selectedToken: JupiterToken | null;
	onTokenSelect: (token: JupiterToken) => void;
}

export default function TokenSelector({
	selectedToken,
	onTokenSelect,
}: TokenSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [tokens, setTokens] = useState<JupiterToken[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchPopularTokens();
	}, []);

	const fetchPopularTokens = async () => {
		setLoading(true);
		try {
			// Fetch verified tokens which have more complete information
			const verifiedTokens = await fetchVerifiedTokens(100);
			setTokens(verifiedTokens);
		} catch (error) {
			console.error("Error fetching tokens:", error);
		} finally {
			setLoading(false);
		}
	};

	const filteredTokens = tokens.filter(
		(token) =>
			token.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			token.name?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center space-x-2 bg-[#E9FF9B] px-2 py-1 rounded text-black/80"
			>
				{selectedToken ? (
					<>
						{selectedToken.logoURI && (
							<Image
								src={selectedToken.logoURI}
								alt={selectedToken.symbol}
								className="w-6 h-6 rounded-full"
								width={24}
								height={24}
							/>
						)}
						<span className="font-medium text-black/80">
							{selectedToken.symbol}
						</span>
						<span className="text-black/80">/ SOL</span>
					</>
				) : (
					<span className="text-black/80">Select Token</span>
				)}
				<ChevronDown className="w-4 h-4" />
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 mt-1 w-96 bg-background border border-gray-600 rounded-lg shadow-xl z-50">
					{/* Search */}
					<div className="p-3 border-b border-gray-700">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/80" />
							<input
								type="text"
								placeholder="Search tokens..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-gray-600 rounded-lg text-white/80 placeholder-white/60 focus:outline-none focus:border-purple-500"
							/>
						</div>
					</div>

					{/* Token List */}
					<div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-background scrollbar-thumb-rounded-full">
						{loading ? (
							<div className="p-4 text-center text-white/80">
								Loading tokens...
							</div>
						) : filteredTokens.length > 0 ? (
							filteredTokens.map((token) => {
								const security = checkTokenSecurity(token);
								return (
									<button
										key={token.address}
										onClick={() => {
											onTokenSelect(token);
											setIsOpen(false);
										}}
										className="w-full flex items-center space-x-3 p-3 hover:bg-white/10 transition-colors text-left"
									>
										{token.logoURI && (
											<img
												src={token.logoURI}
												alt={token.symbol}
												className="w-8 h-8 rounded-full"
											/>
										)}
										<div className="flex-1">
											<div className="flex items-center space-x-2">
												<span className="font-medium text-white/80">
													{token.symbol}
												</span>
												{security.isVerified && (
													<span
														className="w-2 h-2 bg-green-500 rounded-full"
														title="Verified token"
													/>
												)}
											</div>
											<div className="text-sm text-white/60 truncate">
												{token.name}
											</div>
											<div className="flex items-center space-x-2 text-xs">
												{token.daily_volume && (
													<span className="text-white/60">
														Vol: $
														{token.daily_volume.toLocaleString()}
													</span>
												)}
												{security.hasNoFreezeAuthority && (
													<span className="text-blue-700">
														No Freeze
													</span>
												)}
											</div>
										</div>
									</button>
								);
							})
						) : (
							<div className="p-4 text-center text-black/80">
								No tokens found
							</div>
						)}
					</div>
				</div>
			)}

			{/* Backdrop */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40"
					onClick={() => setIsOpen(false)}
				/>
			)}
		</div>
	);
}
