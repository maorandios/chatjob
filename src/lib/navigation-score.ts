/** Higher score = deeper in the navigation stack */
export function getNavigationScore(routeKey: string): number {
  const [pathname, search = ""] = routeKey.split("?");
  const segments = pathname.split("/").filter(Boolean);
  let score = segments.length;

  if (search.includes("changeLang")) {
    score += 0.5;
  }

  return score;
}

export function getNavigationDirection(
  fromKey: string,
  toKey: string
): "forward" | "back" {
  const fromScore = getNavigationScore(fromKey);
  const toScore = getNavigationScore(toKey);

  if (toScore > fromScore) return "forward";
  if (toScore < fromScore) return "back";

  // Same depth — treat as forward (e.g. switching workers)
  return "forward";
}

export function buildRouteKey(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}
