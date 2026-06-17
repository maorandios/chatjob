import type { Worker } from "@/types";

/** Worker has not finished invite onboarding (no verified email yet). */
export function isWorkerInvitePending(
  worker: Pick<Worker, "status" | "email">
): boolean {
  return worker.status === "pending" && !worker.email;
}

/** Worker completed invite onboarding and can chat. */
export function isWorkerJoined(
  worker: Pick<Worker, "status" | "email">
): boolean {
  return !isWorkerInvitePending(worker);
}
