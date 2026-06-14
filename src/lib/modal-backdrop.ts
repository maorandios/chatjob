let lockCount = 0;

export function addModalBackdrop(): void {
  if (typeof document === "undefined") return;
  lockCount += 1;
  document.documentElement.classList.add("modal-open");
}

export function removeModalBackdrop(): void {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.classList.remove("modal-open");
  }
}
