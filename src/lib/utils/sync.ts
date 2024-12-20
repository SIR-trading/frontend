import z from "zod";

const respSchema = z.object({ success: z.boolean() });
/**Helper function used to
 * poll for subgraph block sync
 * **/
export const subgraphSyncPoll = async (
  blockNumber?: number,
  nextIfFail?: boolean,
) => {
  try {
    const resp = (await fetch(
      `/api/sync?${blockNumber ? `block=${blockNumber}` : ""}`,
    ).then((r) => r.json())) as unknown;
    console.log(resp, "RESPONSE");
    const safe = respSchema.safeParse(resp);
    if (safe.success) {
      if (safe.data.success) {
        return { success: true };
      }
      if (!safe.data.success) {
        if (nextIfFail) {
          return { success: true };
        }
      }
    }
  } catch {
    if (nextIfFail) {
      return { success: true };
    }
  }
  return { success: false };
};
