"use client";

import { useEffect, useState } from "react";

export function Countdown({ seconds, prefix }: { seconds: number; prefix?: string }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [left]);

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const urgent = left <= 60;

  return (
    <span className={`num font-bold ${urgent ? "text-clay" : ""}`}>
      {prefix}
      {mins}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export function HoldRing({ seconds, total }: { seconds: number; total: number }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [left]);

  const ratio = total > 0 ? Math.min(1, left / total) : 0;
  const circumference = 2 * Math.PI * 34;

  return (
    <div className="relative grid size-20 shrink-0 place-items-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#E8DCCB" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={left <= 60 ? "#C8452B" : "#2F6B4F"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <div className={`num text-center text-sm font-extrabold ${left <= 60 ? "text-clay" : "text-sage-dark"}`}>
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
      </div>
    </div>
  );
}
