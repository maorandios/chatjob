export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return true;

  const standaloneMedia = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return Boolean(standaloneMedia || iosStandalone);
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent || navigator.vendor || "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

/** Push on mobile only works when the app is installed to the home screen. */
export function isMobileBrowserWithoutInstall(): boolean {
  return isMobileDevice() && !isStandaloneDisplay();
}
