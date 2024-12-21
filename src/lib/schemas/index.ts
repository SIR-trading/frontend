import { z } from "zod";
const linkSchema = z.object({
  name: z.string(),
  url: z.string().url(),
});

export const CreateVaultInputValues = z.object({
  longToken: z.string().startsWith("0x").length(42),
  versusToken: z.string().startsWith("0x").length(42),
  leverageTier: z.string().min(1),
});

export const assetSchema = z.object({
  decimals: z.number().int().positive(),
  description: z.string(),
  explorer: z.string().url(),
  id: z.string().length(42), // Ethereum addresses are 42 characters long
  links: z.array(linkSchema).optional(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
  symbol: z.string(),
  tags: z.array(z.string()).optional(),
  type: z.enum(["ERC20", "ERC721", "ERC1155"]), // Assuming type could be one of these common Ethereum token standards
  website: z.string().url(),
});
export const blockNumberSchema = z.object({
  _meta: z.object({
    block: z.object({
      number: z.number(),
    }),
  }),
});
export const tokenSchema = z.object({
  name: z.string(),
  website: z.string().url(),
  description: z.string(),
  explorer: z.string().url(),
  type: z.enum(["ERC20"]),
  symbol: z.string(),
  decimals: z.number().int(),
  status: z.enum(["active", "inactive"]),
  id: z.string(),
  tags: z.array(z.string()).optional(),
  links: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
      }),
    )
    .optional(),
});
// {
//     "name": "TrueUSD",
//     "website": "https://www.trueusd.com/",
//     "description": "TrueUSD is the first independently-verified digital asset redeemable 1-for-1 for US Dollars.",
//     "explorer": "https://etherscan.io/token/0x0000000000085d4780B73119b644AE5ecd22b376",
//     "type": "ERC20",
//     "symbol": "TUSD",
//     "decimals": 18,
//     "status": "active",
//     "id": "0x0000000000085d4780B73119b644AE5ecd22b376",
//     "tags": [
//         "stablecoin"
//     ],
//     "links": [
//         {
//             "name": "github",
//             "url": "https://github.com/trusttoken/TrueUSD"
//         },
//         {
//             "name": "twitter",
//             "url": "https://twitter.com/tusd_official"
//         },
//         {
//             "name": "telegram",
//             "url": "https://t.me/TUSDofficial_EN"
//         },
//         {
//             "name": "medium",
//             "url": "https://trueusd.medium.com/"
//         },
//         {
//             "name": "coingecko",
//             "url": "https://coingecko.com/en/coins/true-usd/"
//         }
//     ]
// }
