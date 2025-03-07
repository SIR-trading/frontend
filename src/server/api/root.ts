import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { vaultRouter } from "./routers/vault";
import { erc20Router } from "./routers/erc20";
import { quoteRouter } from "./routers/quote";
import { dividendsRouter } from "./routers/dividends";
import { priceRouter } from "./routers/price";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  divends: dividendsRouter,
  vault: vaultRouter,
  erc20: erc20Router,
  quote: quoteRouter,
  price: priceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.user.all();
 *       ^? user[]
 */
export const createCaller = createCallerFactory(appRouter);
