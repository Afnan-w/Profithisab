import * as React from "react";
import { cn } from "@/lib/cn";

export interface TableWrapperProps extends React.HTMLAttributes<HTMLDivElement> {}
export function TableWrapper({ className, ...props }: TableWrapperProps) {
  return <div className={cn("overflow-auto", className)} {...props} />;
}
