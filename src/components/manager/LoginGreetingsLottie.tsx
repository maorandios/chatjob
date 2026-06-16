"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export function LoginGreetingsLottie() {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/Greetings.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load animation");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setAnimationData(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!animationData) return null;

  return (
    <div
      className="pointer-events-none flex min-h-0 flex-1 items-center justify-center px-4 pb-6 pt-2"
      aria-hidden
    >
      <div className="aspect-square h-full w-full max-h-[min(44dvh,22rem)] max-w-[min(100%,22rem)]">
        <Lottie
          animationData={animationData}
          loop
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
