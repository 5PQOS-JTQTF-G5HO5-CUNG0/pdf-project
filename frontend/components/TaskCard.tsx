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
    <div className="bg-surface-1 hover:bg-surface-2/40 border border-hairline hover:border-hairline-strong rounded-xl p-3.5 sm:p-4 transition-all duration-150 ease-out group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* 左侧：文件信息与图标 */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-ink-muted group-hover:text-primary group-hover:border-primary/40 transition-colors shrink-0">
            <FileText className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium text-ink tracking-tight truncate max-w-[280px] sm:max-w-md"
                title={item.file.name}
              >
                {item.file.name}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-ink-subtle font-mono shrink-0">
                {formatBytes(item.file.size)}
              </span>
            </div>

            {/* 状态文字或错误提示 */}
            <div className="mt-1 flex items-center gap-2 text-xs">
              {item.status === "idle" && (
                <span className="text-ink-tertiary">等待开始转换</span>
              )}
              {isBusy && (
                <span className="text-primary flex items-center gap-1.5 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                  正在处理中 ({item.progress}%)
                </span>
              )}
              {item.status === "completed" && (
                <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                  转换完成: {item.outputFilename}
                </span>
              )}
              {item.status === "failed" && (
                <span
                  className="text-rose-400 flex items-center gap-1.5 truncate font-medium"
                  title={item.errorMessage}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  失败: {item.errorMessage || "转换错误"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：目标格式选择与操作按钮 */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          {/* 目标格式选择 */}
          <div className="flex items-center gap-1.5 bg-surface-2 border border-hairline hover:border-hairline-strong px-2.5 py-1 rounded-md transition-colors">
            <span className="text-[11px] text-ink-tertiary">转为</span>
            <ArrowRight className="w-3 h-3 text-ink-tertiary" />
            <select
              value={item.targetFormat}
              disabled={isBusy || item.status === "completed"}
              onChange={(e) => onTargetChange(item.id, e.target.value)}
              className="bg-transparent text-xs font-semibold text-primary hover:text-primary-hover focus:outline-none cursor-pointer uppercase font-mono transition-colors disabled:opacity-50"
            >
              {item.availableTargets.map((t) => (
                <option key={t} value={t} className="bg-surface-3 text-ink">
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* 按钮群 */}
          {item.status === "idle" && (
            <button
              onClick={() => onStartSingle(item.id)}
              className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
              转换
            </button>
          )}

          {item.status === "completed" && item.taskId && item.outputFilename && (
            <a
              href={getDownloadUrl(item.taskId, item.outputFilename)}
              download={item.outputFilename}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-medium transition-all duration-150"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              下载
            </a>
          )}

          {item.status === "failed" && (
            <button
              onClick={() => onRetry(item.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink-muted hover:text-ink border border-hairline hover:border-hairline-strong text-xs font-medium transition-colors"
              title="重试"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              重试
            </button>
          )}

          <button
            onClick={() => onRemove(item.id)}
            disabled={isBusy}
            className="p-1.5 rounded-md text-ink-tertiary hover:text-rose-400 hover:bg-surface-2 border border-transparent hover:border-hairline transition-colors disabled:opacity-30"
            title="移除"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* 进度条动画 */}
      {isBusy && (
        <div className="w-full h-1 bg-surface-2 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(94,106,210,0.6)]"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
