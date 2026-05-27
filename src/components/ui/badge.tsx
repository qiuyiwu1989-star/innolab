import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "solid" | "soft" | "outline";
  color?: string; // CSS color (hex / oklch / var())
}

export function Badge({
  variant = "soft",
  color,
  className,
  style,
  ...props
}: BadgeProps) {
  const styles: React.CSSProperties = { ...style };
  if (color) {
    if (variant === "solid") {
      styles.backgroundColor = color;
      styles.color = "#fff";
    } else if (variant === "soft") {
      styles.backgroundColor = `${color}15`;
      styles.color = color;
    } else if (variant === "outline") {
      styles.borderColor = color;
      styles.color = color;
    }
  }

  return (
    <span
      style={styles}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "outline" && "border",
        className,
      )}
      {...props}
    />
  );
}
