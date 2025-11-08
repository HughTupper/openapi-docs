import { MethodBadgeProps } from "../types";

/**
 * Headless component for rendering HTTP method badges
 * Provides a simple wrapper that can be styled with className
 */
export function MethodBadge({
  method,
  children,
  className,
  style,
  ...props
}: MethodBadgeProps) {
  const methodUpper = method.toUpperCase();

  return (
    <span className={className} style={style} data-method={method} {...props}>
      {children || methodUpper}
    </span>
  );
}
