import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "../components/WalletProvider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Jupiter Sage - Solana DApp",
	description: "A Solana DApp powered by Jupiter's Unified Wallet Kit",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark h-full w-full">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full `}
				suppressHydrationWarning={true}
			>
				<div className="absolute inset-0 bg-[url('/bg.png')] bg-cover bg-center"></div>
				<div className="relative z-20 h-full w-full ">
					<WalletProvider>{children}</WalletProvider>
				</div>
			</body>
		</html>
	);
}
