import { getContactDisplayName, getContactDisplayPhone } from "@/lib/store";
import type { ContactAliases, Worker } from "@/types";

export function filterWorkersByQuery(
  workers: Worker[],
  query: string,
  contactAliases: ContactAliases
): Worker[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return workers;

  return workers.filter((worker) => {
    const displayName = getContactDisplayName(
      contactAliases,
      "manager",
      worker.id,
      worker.name
    );
    const displayPhone = getContactDisplayPhone(
      contactAliases,
      "manager",
      worker.id,
      worker.phone
    );

    return (
      displayName.toLowerCase().includes(trimmed) ||
      worker.name.toLowerCase().includes(trimmed) ||
      displayPhone.includes(trimmed) ||
      worker.phone.includes(trimmed)
    );
  });
}
