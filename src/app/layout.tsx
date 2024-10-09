import "../styles/globals.css";
import "@radix-ui/themes/styles.css";
import { TRPCReactProvider } from "@/trpc/react";
// import Image from "next/image";

import { Toaster } from "@/components/ui/toaster";
import EvmProvider from "@/components/providers/evmProvider";
import { headers } from "next/headers";
import { Header } from "@/components/header";
import { Inter, Bebas_Neue } from "next/font/google";
import Footer from "@/components/footer";
import Bg from "../../public/background.png";
import Warning from "@/components/ui/warning";
const inter = Inter({
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookie = headers().get("cookie");

  // const headerList = headers();
  // const country = headerList.get("x-country");
  return (
    <html lang="en">
      <body
        style={{
          backgroundImage: `url(${Bg.src})`,
          backgroundRepeat: "repeat",
        }}
        className={`relative ${lora.variable} ${inter.className} `}
      >
        {/* <Image */}
        {/*   className="absolute object-fill   z-0 top-0 left-0  w-screen h-full" */}
        {/*   src={Bg} */}
        {/*   loading="eager" */}
        {/*   height={1920} */}
        {/*   alt={""} */}
        {/* /> */}
        <div
          style={{
            background:
              "radial-gradient(55.25% 55.16% at 48.63% 44.84%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)",
            backgroundBlendMode: "lighten",
            boxShadow: "0px 4px 0px 0px rgba(0,0,0,0.5)",
          }}
          className="absolute left-0 top-0 z-[-1] h-full w-full opacity-100"
        ></div>

        <Toaster />
        <TRPCReactProvider>
          <EvmProvider cookie={cookie}>
            <div className=" flex min-h-screen flex-col">
              <Header />
              <Warning />
              {children}
              <Footer />
            </div>
          </EvmProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
