import { Workflow } from "lucide-react";

import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

type BrandLogoProps = {
  showTagline?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  stacked?: boolean;
  label?: "short" | "full";
};

const BrandLogo = ({
  showTagline = false,
  className,
  iconClassName,
  textClassName,
  stacked = false,
  label = "short",
}: BrandLogoProps) => {
  const labelText = label === "full" ? BRAND.fullName : BRAND.name;

  return (
    <div
      aria-label={BRAND.fullName}
      className={cn(
        "flex items-center gap-3",
        stacked && "flex-col items-start gap-2",
        className
      )}
    >
      <span
        className={cn(
          "w-15 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-sm",
          iconClassName
        )}
      >
        <Workflow className="h-5 w-5" />
      </span>
      <div className={cn("flex flex-col", stacked ? "gap-1" : "gap-0.5", textClassName)}>
        <span className="text-xl font-bold uppercase tracking-widest text-primary dark:text-white">
          {labelText}
        </span>
        {showTagline && (
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            {BRAND.tagline}
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
