"use client";

import { useEffect, useState } from "react";

export function LiveClock({
  timezone,
  className,
  showSeconds = true,
}: {
  timezone: string;
  className?: string;
  showSeconds?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) return <span className={className}>--:--</span>;

  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  }).format(now);

  return <span className={`num ${className ?? ""}`}>{text}</span>;
}
