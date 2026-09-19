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
    <header className="border-b border-black/[0.05] bg-white/75 backdrop-blur-2xl sticky top-0 z-40 transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & 品牌标识 */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#1d1d1f] to-[#000000] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
            <FileSpreadsheet className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] text-[#1d1d1f] tracking-tight">
                LocalPDF
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#248a3d] border border-[#34c759]/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#34c759]" strokeWidth={2} />
                离线沙箱
              </span>
            </div>
            <p className="text-[11px] text-[#86868b] hidden sm:block">
              macOS 极简美学 · 本地私密处理
            </p>
          </div>
        </div>

        {/* 顶部 Tab 切换 (苹果 iOS 风格动态胶囊控制器) */}
        <div className="flex items-center bg-[#000000]/[0.05] p-1 rounded-full border border-black/[0.03]">
          <button
            onClick={() => setActiveTab("convert")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === "convert"
                ? "bg-white text-[#1d1d1f] shadow-[0_1px_4px_rgba(0,0,0,0.1)] font-semibold scale-[1.02]"
                : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.8} />
            格式转换
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === "tools"
                ? "bg-white text-[#1d1d1f] shadow-[0_1px_4px_rgba(0,0,0,0.1)] font-semibold scale-[1.02]"
                : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" strokeWidth={1.8} />
            PDF 工具箱
          </button>
        </div>

        {/* 状态与偏好设置 */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.03] text-xs text-[#86868b]">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                isBackendHealthy ? "bg-[#34c759]" : "bg-[#ff3b30] animate-pulse"
              }`}
            />
            <span className="text-[11px] font-medium">
              {isBackendHealthy ? "引擎在线" : "连接中..."}
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#1d1d1f] flex items-center justify-center transition-all active:scale-95"
            title="偏好设置"
          >
            <Settings className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
};
