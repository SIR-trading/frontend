import "../styles/globals.css";
import "@radix-ui/themes/styles.css";
import { TRPCReactProvider } from "@/trpc/react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/toaster";
import EvmProvider from "@/components/providers/evmProvider";
import { Header } from "@/components/header";
import { Inter } from "next/font/google";
import Warning from "@/components/ui/warning";
import Footer from "@/components/footer/footer";
import { VaultProvider } from "@/components/providers/vaultProvider";
import { TokenlistContextProvider } from "@/contexts/tokenListProvider";
import MintFormProvider from "@/components/providers/mintFormProvider";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import FloatingNetworkBadge from "@/components/floatingNetworkBadge";
import { ClaimableBalancesProvider } from "@/contexts/ClaimableBalancesContext";
import { VaultDataProvider } from "@/contexts/VaultDataContext";
import { StakingProvider } from "@/contexts/StakingContext";
import { SirPriceProvider } from "@/contexts/SirPriceContext";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// console.log(Inter, "INTER");
export const metadata = {
  metadataBase: new URL("https://app.sir.trading"),
  title: "SIR",
  description:
    "SIR is a DeFi protocol designed to address the key challenges of leveraged trading, such as volatility decay and liquidation risks, making it safer for long-term investing.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "SIR App Interface",
    description:
      "SIR is a DeFi protocol designed to address the key challenges of leveraged trading, such as volatility decay and liquidation risks, making it safer for long-term investing.",
    url: "https://app.sir.trading",
    siteName: "SIR",
    images: [
      {
        url: "https://app.sir.trading/social-media-preview.png", // Use absolute URL
        width: 1200,
        height: 630,
        alt: "SIR App Interface",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIR App Interface",
    description:
      "SIR is a DeFi protocol designed to address the key challenges of leveraged trading, such as volatility decay and liquidation risks, making it safer for long-term investing.",
    images: ["https://app.sir.trading/social-media-preview.png"],
    creator: "@leveragesir",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} ${inter.className} relative`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="gradient-bg absolute left-0 top-0 z-[-1] h-full w-full opacity-100"></div>
            <Toaster />
            <TRPCReactProvider>
              <TokenlistContextProvider>
                <EvmProvider>
                  <VaultDataProvider>
                    <StakingProvider>
                      <SirPriceProvider>
                        <ClaimableBalancesProvider>
                          <VaultProvider>
                            <MintFormProvider>
                        <div className=" flex min-h-screen flex-col">
                          <Header />
                          <Warning />
                          <div className="">
                            <div className="flex flex-col justify-center">
                              <div
                                className={
                                  "mx-auto mt-8  min-h-[calc(100vh-200px)] w-full max-w-[1280px]  rounded-[8px] p-6"
                                }
                              >
                                {children}
                              </div>{" "}
                            </div>
                          </div>
                          <Footer />
                          <FloatingNetworkBadge />
                        </div>
                            </MintFormProvider>
                          </VaultProvider>
                        </ClaimableBalancesProvider>
                      </SirPriceProvider>
                    </StakingProvider>
                  </VaultDataProvider>
                </EvmProvider>
              </TokenlistContextProvider>
            </TRPCReactProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
