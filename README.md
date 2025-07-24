# SIR-FRONTEND

website:
twitter:

### DEPLOY LOCALLY

`pnpm i`
`pnpm run dev`

### GENERATE GRAPHQL TYPES

`pnpm exec graphclient build`

### ENVIRONMENT VARIABLES

#### Server-side Environment Variables
```
SECRET_KEY=Secret key for server operations
RPC_URL=RPC URL for backend calls
SUBGRAPH_URL=Subgraph query url
KV_REST_API_READ_ONLY_TOKEN=Vercel KV read-only token
KV_REST_API_TOKEN=Vercel KV API token
KV_REST_API_URL=Vercel KV API URL
KV_URL=Vercel KV connection URL
DATABASE_URL=Database connection URL
ALCHEMY_BEARER=Alchemy API bearer token for price data
```

#### Client-side Environment Variables (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_ASSISTANT_ADDRESS=Assistant Contract Address
NEXT_PUBLIC_ORACLE_ADDRESS=Oracle Contract Address
NEXT_PUBLIC_SIR_ADDRESS=Sir Contract Address
NEXT_PUBLIC_VAULT_ADDRESS=Vault Contract Address
NEXT_PUBLIC_CHAIN_ID=Chain id - Ex. 1
NEXT_PUBLIC_BASE_FEE=Base fee for transactions
NEXT_PUBLIC_MINTING_FEE=Minting fee amount
```
