import type { ErrorLog } from "@/app/api/logs/route";

export async function insertErrorLogRequest(error: ErrorLog) {
  const payload: ErrorLog = error;
  const resp = await fetch(`/api/logs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return resp;
}

export const Logger = {
  error: insertErrorLogRequest,
};
