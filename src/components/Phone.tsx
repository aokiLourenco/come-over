import type { ReactNode } from "react";

export function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="phone">
      <div className="phone-screen">{children}</div>
    </div>
  );
}
