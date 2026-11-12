import * as React from "react";
import { cn } from "@/lib/cn";

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}
export function Separator({ className, ...props }: SeparatorProps) {
  return <hr className={cn("border-none h-[1px] bg-border", className)} {...props} />;
}
