"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import T from "@/lib/tokens";

interface ShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function Shell({ children, isAdmin = false }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        isAdmin={isAdmin}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopNav
          isAdmin={isAdmin}
          onMenuToggle={() => setCollapsed((c) => !c)}
        />
        <div style={{ flex: 1, overflowY: "auto", background: T.surfaceLow }}>
          {children}
        </div>
      </div>
    </div>
  );
}
