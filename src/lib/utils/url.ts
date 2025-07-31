import { headers } from "next/headers";

export async function getUrl() {
  const list = await headers();
  const scheme = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = list.get("host");
  return { scheme, host };
}
