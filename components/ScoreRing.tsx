import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 88,
  stroke = 8,
  tone = "light",
}: {
  score: number;
  size?: number;
  stroke?: number;
  tone?: "light" | "dark";
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color =
    score >= 75 ? "#059669" : score >= 60 ? "#d97706" : "#e11d48";

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone === "dark" ? "rgba(255,255,255,0.16)" : "#e2e8f0"}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-semibold leading-none",
            size >= 80 ? "text-xl" : "text-base",
            tone === "dark" ? "text-white" : "text-slate-900",
          )}
        >
          {score}
        </span>
        <span
          className={cn(
            "mt-0.5 text-[9px]",
            tone === "dark" ? "text-white/60" : "text-slate-400",
          )}
        >
          /100
        </span>
      </div>
    </div>
  );
}
