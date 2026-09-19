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
import { Play, Archive, Trash2, Layers, FileCode, Cpu } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"convert" | "tools">("convert");
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [conversionMatrix, setConversionMatrix] = useState<Record<string, string[]>>({});
  const [items, setItems] = useState<FileItem[]>([]);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);

  // 定期检测后端健康状况与支持格式
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

  const getAvailableTargets = (filename: string): string[] => {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    const targets = conversionMatrix[ext];
    if (targets && targets.length > 0) return targets;

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
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isBackendHealthy={isBackendHealthy}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === "convert" ? (
          <div className="space-y-5">
            {/* 上传拖放区域 */}
            <DropZone onFilesSelected={handleFilesSelected} />

            {/* 批量操作控制条 (苹果胶囊面板) */}
            {items.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 px-5 rounded-2xl bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="font-semibold text-[#1d1d1f]">共 {items.length} 个文件</span>
                  {completedCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#34c759]/10 text-[#248a3d] font-mono text-[11px] font-semibold">
                      已完成 {completedCount}
                    </span>
                  )}
                  {idleCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b] font-mono text-[11px]">
                      等待中 {idleCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {idleCount > 0 && (
                    <button
                      onClick={handleStartAll}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      全部开始
                    </button>
                  )}

                  {completedCount > 0 && (
                    <button
                      onClick={handleBatchDownload}
                      disabled={isBatchDownloading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#34c759]/10 hover:bg-[#34c759]/20 text-[#248a3d] border border-[#34c759]/20 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 shadow-xs"
                    >
                      <Archive className="w-3.5 h-3.5" strokeWidth={2} />
                      {isBatchDownloading ? "打包中..." : `打包下载 (${completedCount})`}
                    </button>
                  )}

                  <button
                    onClick={handleClearAll}
                    className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-rose-50 hover:text-[#ff3b30] text-[#86868b] flex items-center justify-center transition-colors"
                    title="清空列表"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            )}

            {/* 文件任务列表 */}
            {items.length > 0 ? (
              <div className="space-y-3">
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
              /* 空状态 苹果生态产品卡片风格 */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-6 rounded-3xl bg-white border border-black/[0.04] hover:border-black/10 transition-all duration-200 shadow-[0_2px_14px_rgba(0,0,0,0.02)] group">
                  <div className="w-11 h-11 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] mb-4 group-hover:scale-105 transition-transform shadow-xs">
                    <FileCode className="w-5 h-5 text-[#0071e3]" strokeWidth={2} />
                  </div>
                  <h4 className="text-sm font-semibold text-[#1d1d1f] tracking-tight mb-1.5">
                    Gotenberg 原生渲染引擎
                  </h4>
                  <p className="text-xs text-[#86868b] leading-relaxed">
                    基于无头 Chromium 与 LibreOffice 核心，高保真还原段落排版、矢量图与公式精度。
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-black/[0.04] hover:border-black/10 transition-all duration-200 shadow-[0_2px_14px_rgba(0,0,0,0.02)] group">
                  <div className="w-11 h-11 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] mb-4 group-hover:scale-105 transition-transform shadow-xs">
                    <Layers className="w-5 h-5 text-[#0071e3]" strokeWidth={2} />
                  </div>
                  <h4 className="text-sm font-semibold text-[#1d1d1f] tracking-tight mb-1.5">
                    对象级 PDF 转 Word
                  </h4>
                  <p className="text-xs text-[#86868b] leading-relaxed">
                    智能提取真实文本流、行内样式与层叠表格结构，杜绝低劣截图，实现真正自由编辑。
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-black/[0.04] hover:border-black/10 transition-all duration-200 shadow-[0_2px_14px_rgba(0,0,0,0.02)] group">
                  <div className="w-11 h-11 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] mb-4 group-hover:scale-105 transition-transform shadow-xs">
                    <Cpu className="w-5 h-5 text-[#0071e3]" strokeWidth={2} />
                  </div>
                  <h4 className="text-sm font-semibold text-[#1d1d1f] tracking-tight mb-1.5">
                    高清晰度无损光栅化
                  </h4>
                  <p className="text-xs text-[#86868b] leading-relaxed">
                    支持 150~600 DPI 印刷级多页光栅化渲染，可一键将图片集合成单文件或导出压缩包。
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

      <footer className="border-t border-black/[0.04] py-8 text-center text-xs text-[#86868b] mt-auto">
        LocalPDF · 运行于本地容器环境 · 数据端侧隔离 · 离线隐私保障
      </footer>

      {/* 设置抽屉 */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
