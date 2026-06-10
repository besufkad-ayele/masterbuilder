import Image from "next/image";
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
      <div
        className={cn(
          "relative flex items-center justify-center",
          iconClassName || "size-10"
        )}
      >
        <Image
          src="/mbllogo.png"
          alt={BRAND.name}
          width={120}
          height={120}
          className="object-contain"
          priority
        />
      </div>
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
