import {
  LABEL_STATUS,
  LABEL_STATUS_SINGKAT,
  STATUS_DOT,
  STATUS_STYLE,
} from "@/lib/constants";
import type { BatchStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  size = "md",
}: {
  status: BatchStatus;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium ring-1 ring-inset",
        STATUS_STYLE[status],
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          STATUS_DOT[status],
          status === "MENUNGGU_PENGESAHAN" && "animate-pulse",
        )}
      />
      {size === "sm" ? LABEL_STATUS_SINGKAT[status] : LABEL_STATUS[status]}
    </span>
  );
}
