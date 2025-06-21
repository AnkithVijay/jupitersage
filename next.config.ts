import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "raw.githubusercontent.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "static.jup.ag",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "arweave.net",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "shdw-drive.genesysgo.net",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "cloudflare-ipfs.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "ipfs.io",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "gateway.pinata.cloud",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname:
					"bafybeie6r6ga4aoxqfn3buw3bjgc73mxwc3ogjekzm6mz5rp7qkr76t2m4.ipfs.nftstorage.link",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
