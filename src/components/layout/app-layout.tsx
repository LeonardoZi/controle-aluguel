// Componente AppLayout
"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Alternar a visibilidade da barra lateral
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar open={sidebarOpen} />

        <main
          className={cn(
            "flex-1 overflow-auto p-6 transition-all duration-300 ease-in-out",
            sidebarOpen ? "md:ml-64" : "ml-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
