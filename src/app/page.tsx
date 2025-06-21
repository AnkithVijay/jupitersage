import Image from "next/image";
import WalletButton from "../components/WalletButton";
import WalletInfo from "../components/WalletInfo";

export default function Home() {
	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
				<div className="flex flex-col items-center gap-4">
					<h1 className="text-4xl font-bold text-center">
						Jupiter Sage
					</h1>
					<p className="text-lg text-center text-gray-600 dark:text-gray-400">
						Powered by Jupiter's Unified Wallet Kit
					</p>
				</div>

				<div className="flex flex-col items-center gap-6 w-full max-w-md">
					<WalletButton />

					<WalletInfo />

					<div className="text-center">
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
							Connect your Solana wallet to get started
						</p>
						<p className="text-xs text-gray-500 dark:text-gray-500">
							Supports all major Solana wallets through Jupiter's
							adapter
						</p>
					</div>
				</div>

				<div className="flex gap-4 items-center flex-col sm:flex-row">
					<a
						className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
						href="https://jup.ag"
						target="_blank"
						rel="noopener noreferrer"
					>
						Visit Jupiter
					</a>
					<a
						className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
						href="https://station.jup.ag/docs/additional-topics/wallet-list"
						target="_blank"
						rel="noopener noreferrer"
					>
						Wallet Docs
					</a>
				</div>
			</main>
			<footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
				<a
					className="flex items-center gap-2 hover:underline hover:underline-offset-4"
					href="https://station.jup.ag"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Image
						aria-hidden
						src="/file.svg"
						alt="File icon"
						width={16}
						height={16}
					/>
					Jupiter Station
				</a>
				<a
					className="flex items-center gap-2 hover:underline hover:underline-offset-4"
					href="https://github.com/jup-ag/wallet-adapter"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Image
						aria-hidden
						src="/window.svg"
						alt="Window icon"
						width={16}
						height={16}
					/>
					GitHub
				</a>
				<a
					className="flex items-center gap-2 hover:underline hover:underline-offset-4"
					href="https://www.npmjs.com/package/@jup-ag/wallet-adapter"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Image
						aria-hidden
						src="/globe.svg"
						alt="Globe icon"
						width={16}
						height={16}
					/>
					NPM Package
				</a>
			</footer>
		</div>
	);
}
