import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    RPC_URL: z.string(),
    SUBGRAPH_URL: z.string(),
    REDIS_URL: z.string(),
    ALCHEMY_BEARER: z.string(),
    COINGECKO_API_KEY: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   *
   * Note: Most contract addresses and system parameters are now fetched at build time
   * from the Assistant contract. Only the Assistant address is required in env variables.
   */
  client: {
    NEXT_PUBLIC_ASSISTANT_ADDRESS: z.string(),
    NEXT_PUBLIC_CHAIN_ID: z.string(),
    NEXT_PUBLIC_WRAPPED_TOKEN_ADDRESS: z.string(),

    // Note: BASE_FEE and MINTING_FEE are now fetched at build time from contracts
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    ALCHEMY_BEARER: process.env.ALCHEMY_BEARER,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    RPC_URL: process.env.RPC_URL,
    SUBGRAPH_URL: process.env.SUBGRAPH_URL,
    NEXT_PUBLIC_ASSISTANT_ADDRESS: process.env.NEXT_PUBLIC_ASSISTANT_ADDRESS,
    NEXT_PUBLIC_WRAPPED_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_WRAPPED_TOKEN_ADDRESS,
    REDIS_URL: process.env.REDIS_URL,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR:''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
