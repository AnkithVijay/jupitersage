export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="h-full w-full flex flex-col relative z-10 overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
			<div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 size-[49rem] rounded-e-full border bg-gradient-to-b from-[#E9FF9B]/5 to-[#E9FF9B]/15 z-20 blur-3xl"></div>
			{children}
		</div>
	);
}
