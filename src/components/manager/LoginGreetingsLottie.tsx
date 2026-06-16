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
      className="pointer-events-none flex w-full items-center justify-center px-2"
      aria-hidden
    >
      <div className="aspect-square w-full max-h-[min(20dvh,13rem)] max-w-[min(100%,13rem)]">
        <Lottie
          animationData={animationData}
          loop
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
