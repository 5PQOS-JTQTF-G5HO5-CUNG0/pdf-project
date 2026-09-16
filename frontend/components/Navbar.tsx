"use client";

import React from "react";
import { ShieldCheck, FileSpreadsheet, Wrench, Settings } from "lucide-react";

interface NavbarProps {
  activeTab: "convert" | "tools";
  setActiveTab: (tab: "convert" | "tools") => void;
  onOpenSettings: () => void;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  isBackendHealthy,
}) => {
  return (
    <header className="border-b border-hairline bg-canvas/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & 隐私保障 */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-hairline text-ink flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-ink tracking-tight">
                LocalPDF
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                离线隔离
              </span>
            </div>
          </div>
        </div>

        {/* 顶部 Tab 切换 (Linear Segmented Control) */}
        <div className="flex items-center bg-surface-1 border border-hairline p-0.5 rounded-lg">
          <button
            onClick={() => setActiveTab("convert")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all duration-150 ${
              activeTab === "convert"
                ? "bg-surface-2 text-ink border border-hairline-strong font-medium shadow-none"
                : "text-ink-subtle hover:text-ink border border-transparent"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.75} />
            通用转换
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all duration-150 ${
              activeTab === "tools"
                ? "bg-surface-2 text-ink border border-hairline-strong font-medium shadow-none"
                : "text-ink-subtle hover:text-ink border border-transparent"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" strokeWidth={1.75} />
            PDF 工具箱
          </button>
        </div>

        {/* 状态与设置 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-1 border border-hairline text-xs text-ink-subtle font-mono">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendHealthy ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="text-[11px]">
              {isBackendHealthy ? "本地容器正常" : "后端连接中"}
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md bg-surface-1 hover:bg-surface-2 text-ink-subtle hover:text-ink border border-hairline hover:border-hairline-strong transition-colors"
            title="全局偏好设置"
          >
            <Settings className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
};
