import { cn } from "./utils";
import { ReactNode } from "react";

export const Th = ({ children }: { children: ReactNode }) => (
  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
    {children}
  </th>
);

export const Td = ({ children, numeric }: { children: ReactNode; numeric?: boolean }) => (
  <td
    className={cn(
      "px-3 py-2 text-sm text-slate-700 dark:text-slate-100",
      numeric ? "text-right tabular-nums" : ""
    )}
  >
    {children}
  </td>
);
