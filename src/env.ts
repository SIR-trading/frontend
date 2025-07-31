import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string(),
    SECRET_KEY: z.string(),
    RPC_URL: z.string(),
    SUBGRAPH_URL: z.string(),
    KV_REST_API_READ_ONLY_TOKEN: z.string(),
    KV_REST_API_TOKEN: z.string(),
    KV_REST_API_URL: z.string(),
    REDIS_URL: z.string(),
    KV_URL: z.string(),
    ALCHEMY_BEARER: z.string(),
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

    // Optional: Keep these for backward compatibility during migration
    // These will be used as fallbacks if build-time data fetching fails
    NEXT_PUBLIC_ORACLE_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_SIR_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_VAULT_ADDRESS: z.string().optional(),
    // Note: BASE_FEE and MINTING_FEE are now fetched at build time from contracts
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SECRET_KEY: process.env.SECRET_KEY,
    ALCHEMY_BEARER: process.env.ALCHEMY_BEARER,
    NEXT_PUBLIC_ORACLE_ADDRESS: process.env.NEXT_PUBLIC_ORACLE_ADDRESS,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_VAULT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_ADDRESS,
    RPC_URL: process.env.RPC_URL,
    SUBGRAPH_URL: process.env.SUBGRAPH_URL,
    NEXT_PUBLIC_ASSISTANT_ADDRESS: process.env.NEXT_PUBLIC_ASSISTANT_ADDRESS,
    NEXT_PUBLIC_SIR_ADDRESS: process.env.NEXT_PUBLIC_SIR_ADDRESS,
    KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_TOKEN,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_URL: process.env.KV_URL, // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
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
