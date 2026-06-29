export const LOCATION_PERMISSION_READY_EVENT = "jobchat-location-permission-ready";

const LOCATION_PERMISSION_READY_KEY = "jobchat:location-permission-ready";

export function hasLocationPermissionReadyFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LOCATION_PERMISSION_READY_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLocationPermissionReady(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCATION_PERMISSION_READY_KEY, "1");
  } catch {
    // Ignore storage failures; the current share can still continue.
  }
  window.dispatchEvent(new Event(LOCATION_PERMISSION_READY_EVENT));
}

