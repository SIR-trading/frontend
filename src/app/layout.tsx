import "../styles/globals.css";
import "@radix-ui/themes/styles.css";
import { TRPCReactProvider } from "@/trpc/react";
// import Image from "next/image";

import { Toaster } from "@/components/ui/toaster";
import EvmProvider from "@/components/providers/evmProvider";
import { headers } from "next/headers";
import { Header } from "@/components/header";
import { Bebas_Neue, Poppins } from "next/font/google";
import Bg from "../../public/background.png";
import Warning from "@/components/ui/warning";
import Footer from "@/components/footer/footer";
import { VaultProvider } from "@/components/providers/vaultProvider";
import { api } from "@/trpc/server";
const inter = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
const lora = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lora",
});

// console.log(Inter, "INTER");
export const metadata = {
  title: "SIR",
  description: "Description",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookie = headers().get("cookie");
  const vaults = await api.vault.getVaults();
  // const headerList = headers();
  // const country = headerList.get("x-country");
  return (
    <html lang="en">
      <title>SIR App</title>
      <body
        style={{
          backgroundImage: `url(${Bg.src})`,
          backgroundRepeat: "repeat",
        }}
        className={`relative  font-semibold  ${lora.variable} ${inter.className} `}
      >
        <div
          style={{
            background:
              "radial-gradient(55.25% 55.16% at 48.63% 44.84%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.02) 100%)",
            backgroundBlendMode: "lighten",
            boxShadow: "0px 4px 0px 0px rgba(0,0,0,1)",
          }}
          className="absolute left-0 top-0 z-[-2] h-full w-full opacity-100"
        ></div>
        <div className="absolute left-0 top-0 z-[-1] h-full w-full bg-black/10 opacity-100"></div>

        <Toaster />
        <TRPCReactProvider>
          <EvmProvider cookie={cookie}>
            <VaultProvider graphVaults={vaults?.vaults ?? []}>
              <div className=" flex min-h-screen flex-col">
                <Header />
                <Warning />
                {children}
                <Footer />
              </div>
            </VaultProvider>
          </EvmProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
