import { Open_Sans, EB_Garamond } from "next/font/google";

// Open Sans - clean sans-serif similar to Lucida Grande
export const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
});

// EB Garamond - authentic Garamond revival
export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-eb-garamond",
});
