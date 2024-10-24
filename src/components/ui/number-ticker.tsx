"use client";

import { cn } from "@/lib/utils";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

export default function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}: {
  value: number;
  direction?: "up" | "down";
  className?: string;
  delay?: number; // delay in s
  decimalPlaces?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const motionValue = useMotionValue(
    hasAnimated.current ? (direction === "down" ? 0 : value) : value,
  );
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const setValue = useCallback((value: number) => {
    if (ref.current) {
      ref.current.textContent = Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(value.toFixed(decimalPlaces)));
    }
  }, []);

  useEffect(() => {
    if (!isInView) return;

    if (!hasAnimated.current) {
      hasAnimated.current = true;
      setValue(value);
      return;
    }

    setTimeout(() => {
      motionValue.set(direction === "down" ? 0 : value);
    }, delay * 1000);
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(() => {
    springValue.on("change", setValue);
  }, [springValue, decimalPlaces, setValue]);

  return (
    <span
      className={cn(
        "inline-block tabular-nums text-black dark:text-white tracking-wider",
        className,
      )}
      ref={ref}
    />
  );
}
