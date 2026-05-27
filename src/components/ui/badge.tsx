import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "soft" | "ghost";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  solid: "bg-volt text-ink",
  soft: "bg-volt/15 text-volt",
  outline: "border border-fog-2 text-ash",
  ghost: "text-ash",
};

export function Badge({
  variant = "outline",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
