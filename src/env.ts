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
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APE_HASH: z.string(),
    NEXT_PUBLIC_ASSISTANT_ADDRESS: z.string(),
    NEXT_PUBLIC_SIR_ADDRESS: z.string(),
    NEXT_PUBLIC_VAULT_ADDRESS: z.string(),
    NEXT_PUBLIC_CHAIN_ID: z.string(),
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_VAULT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_ADDRESS,
    NEXT_PUBLIC_APE_HASH: process.env.NEXT_PUBLIC_APE_HASH,
    RPC_URL: process.env.RPC_URL,
    SUBGRAPH_URL: process.env.SUBGRAPH_URL,
    NEXT_PUBLIC_ASSISTANT_ADDRESS: process.env.NEXT_PUBLIC_ASSISTANT_ADDRESS,
    NEXT_PUBLIC_SIR_ADDRESS: process.env.NEXT_PUBLIC_SIR_ADDRESS,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
