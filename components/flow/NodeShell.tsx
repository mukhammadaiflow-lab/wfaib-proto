import { ReactNode } from "react";

export function NodeShell(props: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#0f1730",
        border: "1px solid rgba(255,255,255,0.12)",
        minWidth: 220,
      }}
    >
      <div
        style={{
          padding: 10,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>{props.title}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{props.subtitle ?? ""}</div>
      </div>
      <div style={{ padding: 10 }}>{props.children}</div>
    </div>
  );
}

