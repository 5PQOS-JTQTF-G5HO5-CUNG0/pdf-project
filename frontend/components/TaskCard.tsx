"use client";

import React from "react";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  RotateCcw,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getDownloadUrl } from "@/lib/api";

export interface FileItem {
  id: string;
  file: File;
  targetFormat: string;
  availableTargets: string[];
  status: "idle" | "pending" | "processing" | "completed" | "failed";
  progress: number;
  taskId?: string;
  outputFilename?: string;
  errorMessage?: string;
}

interface TaskCardProps {
  item: FileItem;
  onTargetChange: (id: string, target: string) => void;
  onStartSingle: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export const TaskCard: React.FC<TaskCardProps> = ({
  item,
  onTargetChange,
  onStartSingle,
  onRetry,
  onRemove,
}) => {
  const isBusy = item.status === "pending" || item.status === "processing";

  return (
    <div className="bg-white hover:border-black/10 border border-black/[0.04] rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* 左侧：文件信息与图标 */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-xl bg-[#f5f5f7] border border-black/[0.03] flex items-center justify-center text-[#1d1d1f] shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-[#1d1d1f]" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold text-[#1d1d1f] tracking-tight truncate max-w-[260px] sm:max-w-md"
                title={item.file.name}
              >
                {item.file.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b] font-mono shrink-0">
                {formatBytes(item.file.size)}
              </span>
            </div>

            {/* 状态文字或错误提示 */}
            <div className="mt-1 flex items-center gap-2 text-xs">
              {item.status === "idle" && (
                <span className="text-[#86868b]">就绪，等待转换</span>
              )}
              {isBusy && (
                <span className="text-[#0071e3] flex items-center gap-1.5 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0071e3]" strokeWidth={2} />
                  正在转换 ({item.progress}%)
                </span>
              )}
              {item.status === "completed" && (
                <span className="text-[#248a3d] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" strokeWidth={2} />
                  转换完成: {item.outputFilename}
                </span>
              )}
              {item.status === "failed" && (
                <span
                  className="text-[#ff3b30] flex items-center gap-1.5 truncate font-medium"
                  title={item.errorMessage}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  失败: {item.errorMessage || "转换错误"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：目标格式胶囊与操作按钮 */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {/* 格式选择胶囊 (苹果原生风格) */}
          <div className="flex items-center gap-1.5 bg-[#f5f5f7] border border-black/[0.04] rounded-full px-3 py-1.5">
            <span className="text-[11px] text-[#86868b] font-medium">转为</span>
            <ArrowRight className="w-3 h-3 text-[#86868b]" />
            <select
              value={item.targetFormat}
              disabled={isBusy || item.status === "completed"}
              onChange={(e) => onTargetChange(item.id, e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#1d1d1f] focus:outline-none cursor-pointer uppercase font-mono disabled:opacity-50"
            >
              {item.availableTargets.map((t) => (
                <option key={t} value={t} className="bg-white text-black">
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* 动作按钮 */}
          {item.status === "idle" && (
            <button
              onClick={() => onStartSingle(item.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
              转换
            </button>
          )}

          {item.status === "completed" && item.taskId && item.outputFilename && (
            <a
              href={getDownloadUrl(item.taskId, item.outputFilename)}
              download={item.outputFilename}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#34c759]/10 hover:bg-[#34c759]/20 text-[#248a3d] border border-[#34c759]/20 text-xs font-semibold transition-all active:scale-95 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              下载
            </a>
          )}

          {item.status === "failed" && (
            <button
              onClick={() => onRetry(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#ff3b30] text-xs font-medium transition-all active:scale-95"
              title="重试"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={2} />
              重试
            </button>
          )}

          <button
            onClick={() => onRemove(item.id)}
            disabled={isBusy}
            className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-rose-50 hover:text-[#ff3b30] text-[#86868b] flex items-center justify-center transition-colors disabled:opacity-30"
            title="移除此项"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* 极细 3px 苹果风格进度条 */}
      {isBusy && (
        <div className="w-full h-1 bg-[#f5f5f7] rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-[#0071e3] transition-all duration-300 rounded-full"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
