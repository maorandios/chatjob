"use client";

import {
  buildRouteKey,
  getNavigationDirection,
} from "@/lib/navigation-score";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const TRANSITION_MS = 320;

type StackLayer = {
  key: string;
  node: ReactNode;
};

type PageStackTransitionProps = {
  children: ReactNode;
  dir?: "ltr" | "rtl";
};

export function PageStackTransition({
  children,
  dir = "rtl",
}: PageStackTransitionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = buildRouteKey(pathname, search);

  const storedRef = useRef<StackLayer>({ key: routeKey, node: children });
  const [layers, setLayers] = useState<StackLayer[]>([
    { key: routeKey, node: children },
  ]);
  const [animating, setAnimating] = useState(false);
  const animatingRef = useRef(false);
  const directionRef = useRef<"forward" | "back">("forward");

  useLayoutEffect(() => {
    if (routeKey === storedRef.current.key) {
      storedRef.current = { key: routeKey, node: children };
      if (!animatingRef.current) {
        setLayers([{ key: routeKey, node: children }]);
      }
      return;
    }

    const outgoing = storedRef.current;
    directionRef.current = getNavigationDirection(outgoing.key, routeKey);
    storedRef.current = { key: routeKey, node: children };

    setLayers([
      { key: outgoing.key, node: outgoing.node },
      { key: routeKey, node: children },
    ]);
    animatingRef.current = true;
    setAnimating(true);

    const timer = window.setTimeout(() => {
      setLayers([{ key: routeKey, node: children }]);
      animatingRef.current = false;
      setAnimating(false);
    }, TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [routeKey, children]);

  const direction = directionRef.current;
  const motionDir = dir === "rtl" ? "rtl" : "ltr";

  return (
    <div className="page-stack-host">
      {layers.map((layer, index) => {
        const isIncoming = index === layers.length - 1;
        const isOutgoing = index === 0 && layers.length > 1;

        let motionClass = "";
        if (animating && layers.length > 1) {
          if (direction === "forward") {
            motionClass = isIncoming ? "page-forward-enter" : "page-forward-exit";
          } else if (isOutgoing) {
            motionClass = "page-back-exit";
          } else {
            motionClass = "page-back-enter";
          }
        }

        return (
          <div
            key={layer.key}
            className={cn(
              "page-stack-layer",
              `page-stack-${motionDir}`,
              motionClass
            )}
          >
            {layer.node}
          </div>
        );
      })}
    </div>
  );
}
