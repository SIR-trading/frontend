import "../styles/globals.css";
import "@radix-ui/themes/styles.css";
import { TRPCReactProvider } from "@/trpc/react";
import { GeistSans } from "geist/font/sans";

// import Image from "next/image";

import { Toaster } from "@/components/ui/toaster";
import EvmProvider from "@/components/providers/evmProvider";
import { headers } from "next/headers";
import { Header } from "@/components/header";
import { Inter } from "next/font/google";
import Bg from "../../public/background.png";
import Warning from "@/components/ui/warning";
import Footer from "@/components/footer/footer";
import { VaultProvider } from "@/components/providers/vaultProvider";
import { TokenlistContextProvider } from "@/contexts/tokenListProvider";
import MintFormProvider from "@/components/providers/mintFormProvider";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// console.log(Inter, "INTER");
export const metadata = {
  title: "SIR",
  description:
    "SIR is a DeFi protocol designed to address the key challenges of leveraged trading, such as volatility decay and liquidation risks, making it safer for long-term investing.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookie = headers().get("cookie");
  // const headerList = headers();
  // const country = headerList.get("x-country");
  return (
    <html lang="en" data-theme="dark">
      <title>SIR App</title>
      <body className={`relative  ${GeistSans.variable} ${inter.className}`}>
        <div className="gradient-bg absolute left-0 top-0 z-[-1] h-full w-full opacity-100"></div>

        <Toaster />
        <TRPCReactProvider>
          <TokenlistContextProvider>
            <EvmProvider cookie={cookie}>
              <VaultProvider>
                <MintFormProvider>
                  <div className=" flex min-h-screen flex-col">
                    <Header />
                    <Warning />
                    <div
                      className={
                        "mx-auto mt-8 w-full max-w-[1280px] rounded-[8px] p-6 dark:border dark:border-border"
                      }
                    >
                      {children}
                    </div>
                    <Footer />
                  </div>
                </MintFormProvider>
              </VaultProvider>
            </EvmProvider>
          </TokenlistContextProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
