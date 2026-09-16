"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { DropZone } from "@/components/DropZone";
import { TaskCard, FileItem } from "@/components/TaskCard";
import { PdfToolsPanel } from "@/components/PdfToolsPanel";
import { SettingsModal } from "@/components/SettingsModal";
import {
  checkHealth,
  getConversionMatrix,
  submitConvert,
  getTaskStatus,
  triggerBatchDownload,
} from "@/lib/api";
import { Play, Archive, Trash2, Sparkles, Layers, FileCode, Cpu } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"convert" | "tools">("convert");
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [conversionMatrix, setConversionMatrix] = useState<Record<string, string[]>>({});
  const [items, setItems] = useState<FileItem[]>([]);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);

  // 定期检测后端健康状况与获取支持格式矩阵
  useEffect(() => {
    const init = async () => {
      try {
        const health = await checkHealth();
        setIsBackendHealthy(health.status === "ok");
        const matrix = await getConversionMatrix();
        setConversionMatrix(matrix);
      } catch (err) {
        setIsBackendHealthy(false);
      }
    };
    init();
    const timer = setInterval(init, 8000);
    return () => clearInterval(timer);
  }, []);

  // 轮询正在进行中的任务
  useEffect(() => {
    const activeTasks = items.filter(
      (item) => item.status === "pending" || item.status === "processing"
    );
    if (activeTasks.length === 0) return;

    const interval = setInterval(async () => {
      for (const item of activeTasks) {
        if (!item.taskId) continue;
        try {
          const task = await getTaskStatus(item.taskId);
          setItems((prev) =>
            prev.map((it) => {
              if (it.id === item.id) {
                return {
                  ...it,
                  status: task.status,
                  progress: task.progress,
                  outputFilename: task.output_filename,
                  errorMessage: task.error_message,
                };
              }
              return it;
            })
          );
        } catch (err) {
          // 容错处理
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [items]);

  // 获取文件推荐可转格式
  const getAvailableTargets = (filename: string): string[] => {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    const targets = conversionMatrix[ext];
    if (targets && targets.length > 0) return targets;

    // 默认 fallback
    if ([".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"].includes(ext)) {
      return ["pdf"];
    }
    if (ext === ".pdf") {
      return ["docx", "xlsx", "pptx", "png", "jpg", "webp"];
    }
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return ["pdf"];
    }
    return ["pdf"];
  };

  const handleFilesSelected = (newFiles: File[]) => {
    const newItems: FileItem[] = newFiles.map((file) => {
      const targets = getAvailableTargets(file.name);
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        targetFormat: targets[0] || "pdf",
        availableTargets: targets,
        status: "idle",
        progress: 0,
      };
    });
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleTargetChange = (id: string, target: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, targetFormat: target } : item))
    );
  };

  const startTask = async (item: FileItem) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, status: "pending", progress: 5, errorMessage: undefined } : it
      )
    );

    try {
      const res = await submitConvert(item.file, item.targetFormat);
      if (res.success && res.task_id) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, taskId: res.task_id } : it))
        );
      } else {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: "failed", errorMessage: res.message || "任务创建失败" }
              : it
          )
        );
      }
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, status: "failed", errorMessage: err.message || "请求异常" }
            : it
        )
      );
    }
  };

  const handleStartAll = () => {
    items
      .filter((it) => it.status === "idle" || it.status === "failed")
      .forEach((it) => startTask(it));
  };

  const handleRetry = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (item) startTask(item);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleBatchDownload = async () => {
    const completedTaskIds = items
      .filter((it) => it.status === "completed" && it.taskId)
      .map((it) => it.taskId as string);

    if (completedTaskIds.length === 0) return;

    setIsBatchDownloading(true);
    try {
      await triggerBatchDownload(completedTaskIds);
    } catch (err: any) {
      alert(err.message || "打包下载失败");
    } finally {
      setIsBatchDownloading(false);
    }
  };

  const completedCount = items.filter((it) => it.status === "completed").length;
  const idleCount = items.filter((it) => it.status === "idle").length;

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink selection:bg-primary/30">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isBackendHealthy={isBackendHealthy}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {activeTab === "convert" ? (
          <div className="space-y-5">
            {/* 上传拖放区域 */}
            <DropZone onFilesSelected={handleFilesSelected} />

            {/* 批量操作工具条 */}
            {items.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl bg-surface-1 border border-hairline shadow-none">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="font-medium text-ink">共 {items.length} 个文件</span>
                  {completedCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                      已完成 {completedCount}
                    </span>
                  )}
                  {idleCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-surface-2 border border-hairline text-ink-subtle font-mono text-[11px]">
                      待处理 {idleCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {idleCount > 0 && (
                    <button
                      onClick={handleStartAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                      全部转换
                    </button>
                  )}

                  {completedCount > 0 && (
                    <button
                      onClick={handleBatchDownload}
                      disabled={isBatchDownloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-medium transition-all duration-150 disabled:opacity-40"
                    >
                      <Archive className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {isBatchDownloading ? "打包中..." : `打包下载 (${completedCount})`}
                    </button>
                  )}

                  <button
                    onClick={handleClearAll}
                    className="p-1.5 rounded-md text-ink-tertiary hover:text-rose-400 hover:bg-surface-2 border border-transparent hover:border-hairline transition-colors"
                    title="清空列表"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            )}

            {/* 文件任务列表 */}
            {items.length > 0 ? (
              <div className="space-y-2.5">
                {items.map((item) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    onTargetChange={handleTargetChange}
                    onStartSingle={() => startTask(item)}
                    onRetry={handleRetry}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            ) : (
              /* 空状态 Linear 风格架构特性卡片 */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                <div className="p-4 sm:p-5 rounded-xl bg-surface-1 border border-hairline hover:border-hairline-strong transition-all duration-150 group">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-primary group-hover:border-primary/40 transition-colors mb-3">
                    <FileCode className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-xs font-medium text-ink tracking-tight mb-1">
                    Gotenberg 原生转 PDF
                  </h4>
                  <p className="text-[12px] text-ink-subtle leading-relaxed">
                    基于 Chromium 与 LibreOffice 核心，100% 保持排版、矢量公式与高精图表结构。
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-surface-1 border border-hairline hover:border-hairline-strong transition-all duration-150 group">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-primary group-hover:border-primary/40 transition-colors mb-3">
                    <Layers className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-xs font-medium text-ink tracking-tight mb-1">
                    对象级 PDF 转 Word
                  </h4>
                  <p className="text-[12px] text-ink-subtle leading-relaxed">
                    智能提取真实文本流、行内排版与表格结构，告别全屏位图伪装，实现真正可编辑。
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-surface-1 border border-hairline hover:border-hairline-strong transition-all duration-150 group">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-primary group-hover:border-primary/40 transition-colors mb-3">
                    <Cpu className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-xs font-medium text-ink tracking-tight mb-1">
                    高清晰度光栅化
                  </h4>
                  <p className="text-[12px] text-ink-subtle leading-relaxed">
                    支持 150~600 DPI 高清多页渲染，原生导出 ZIP 压缩包或将图片集合并为单文件。
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* PDF 专属工具箱页面 */
          <PdfToolsPanel />
        )}
      </main>

      <footer className="border-t border-hairline py-6 text-center text-xs text-ink-tertiary">
        LocalPDF · 运行于本地容器环境 · 文件零外发 · 离线隐私保障
      </footer>

      {/* 设置抽屉 */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
