"use client";
import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWatch  = pathname.startsWith("/watch");
  return (
    <div style={isWatch ? undefined : { paddingTop: "var(--nav-total)" }}>
      {children}
    </div>
  );
}
