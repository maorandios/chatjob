"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

type MainLoaderProps = {
  className?: string;
};

export function MainLoader({ className = "h-20 w-20" }: MainLoaderProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/mainloader.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load main loader");
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

  if (!animationData) {
    return (
      <div
        className={`${className} rounded-full bg-[var(--jobchat-accent-light)]`}
        aria-hidden
      />
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop
      className={className}
      aria-hidden
    />
  );
}
