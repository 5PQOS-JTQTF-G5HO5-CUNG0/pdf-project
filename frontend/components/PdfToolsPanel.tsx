"use client";

import React, { useState } from "react";
import {
  Layers,
  Scissors,
  RotateCw,
  Minimize2,
  Lock,
  Stamp,
  Upload,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
  FileSearch,
  ScanText,
  Sparkles,
} from "lucide-react";
import { submitPdfTool, getTaskStatus, getDownloadUrl, TaskInfo } from "@/lib/api";

type ToolType =
  | "merge"
  | "split"
  | "rotate"
  | "compress"
  | "security"
  | "watermark"
  | "searchable"
  | "ocr";

export const PdfToolsPanel: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolType>("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 参数表单状态
  const [splitRanges, setSplitRanges] = useState("1-3");
  const [splitMode, setSplitMode] = useState<"each" | "ranges">("ranges");
  const [rotateAngle, setRotateAngle] = useState(90);
  const [rotatePages, setRotatePages] = useState("all");
  const [compressLevel, setCompressLevel] = useState("medium");
  const [securityAction, setSecurityAction] = useState<"encrypt" | "decrypt">("encrypt");
  const [password, setPassword] = useState("");
  const [watermarkText, setWatermarkText] = useState("机密文件 请勿外传");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkRotation, setWatermarkRotation] = useState(45);
  const [searchableDpi, setSearchableDpi] = useState(200);
  const [ocrFormat, setOcrFormat] = useState<"docx" | "txt">("docx");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const isOcrOrSearchable = selectedTool === "ocr" || selectedTool === "searchable";
      const allowedExts = isOcrOrSearchable
        ? [".pdf", ".jpg", ".jpeg", ".png", ".webp"]
        : [".pdf"];

      const selected = Array.from(e.target.files).filter((f) => {
        const name = f.name.toLowerCase();
        return allowedExts.some((ext) => name.endsWith(ext));
      });

      setFiles(selected);
      setError(null);
      setCurrentTask(null);
    }
  };

  const handleExecute = async () => {
    if (files.length === 0) {
      setError("请先选择要处理的文件。");
      return;
    }
    if (selectedTool === "merge" && files.length < 2) {
      setError("合并操作至少需要选择 2 个 PDF 文件。");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setCurrentTask(null);

    let action = selectedTool;
    const options: Record<string, any> = {};

    if (selectedTool === "split") {
      options.page_ranges = splitMode === "each" ? "each" : splitRanges;
    } else if (selectedTool === "rotate") {
      options.angle = rotateAngle;
      options.pages = rotatePages;
    } else if (selectedTool === "compress") {
      options.level = compressLevel;
    } else if (selectedTool === "security") {
      if (!password) {
        setError("请输入密码。");
        setIsProcessing(false);
        return;
      }
      action = securityAction as ToolType;
      options.password = password;
    } else if (selectedTool === "watermark") {
      if (!watermarkText.trim()) {
        setError("水印文字不能为空。");
        setIsProcessing(false);
        return;
      }
      options.text = watermarkText;
      options.opacity = watermarkOpacity;
      options.rotation = watermarkRotation;
    } else if (selectedTool === "searchable") {
      options.dpi = searchableDpi;
    } else if (selectedTool === "ocr") {
      options.format = ocrFormat;
    }

    try {
      const res = await submitPdfTool(action, files, options);
      if (!res.success || !res.task_id) {
        setError(res.message || "任务提交失败");
        setIsProcessing(false);
        return;
      }

      // 轮询直到完成
      const taskId = res.task_id;
      const interval = setInterval(async () => {
        try {
          const task = await getTaskStatus(taskId);
          setCurrentTask(task);
          if (task.status === "completed" || task.status === "failed") {
            clearInterval(interval);
            setIsProcessing(false);
            if (task.status === "failed") {
              setError(task.error_message || "处理失败");
            }
          }
        } catch (e) {
          clearInterval(interval);
          setIsProcessing(false);
          setError("查询任务状态失败");
        }
      }, 1000);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || "请求发生异常");
    }
  };

  return (
    <div className="bg-surface-1 border border-hairline rounded-xl p-5 sm:p-6 shadow-none">
      {/* 顶部工具卡片选择 - 8大工具 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-6">
        {[
          { id: "merge", name: "合并 PDF", icon: Layers, desc: "多文件合并" },
          { id: "split", name: "拆分 / 提取", icon: Scissors, desc: "提取或全拆" },
          { id: "rotate", name: "页面旋转", icon: RotateCw, desc: "多角度旋转" },
          { id: "compress", name: "体积压缩", icon: Minimize2, desc: "清理冗余对象" },
          { id: "security", name: "加密 / 解密", icon: Lock, desc: "AES-256 保护" },
          { id: "watermark", name: "文字水印", icon: Stamp, desc: "防伪半透明" },
          { id: "searchable", name: "可搜索 PDF", icon: FileSearch, desc: "OCR 文本层" },
          { id: "ocr", name: "OCR 提取文字", icon: ScanText, desc: "转为 Word/TXT" },
        ].map((tool) => {
          const Icon = tool.icon;
          const active = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setSelectedTool(tool.id as ToolType);
                setCurrentTask(null);
                setError(null);
                setFiles([]);
              }}
              className={`p-2.5 rounded-lg border text-left transition-all duration-150 ${
                active
                  ? "bg-surface-2 border-hairline-strong text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "bg-surface-1 border-hairline/60 hover:border-hairline hover:bg-surface-2/50 text-ink-subtle hover:text-ink"
              }`}
            >
              <Icon
                className={`w-4 h-4 mb-1.5 ${
                  active ? "text-primary" : "text-ink-subtle"
                }`}
                strokeWidth={1.75}
              />
              <div className="text-xs font-medium tracking-tight text-ink">{tool.name}</div>
              <div className="text-[10px] text-ink-tertiary truncate mt-0.5">
                {tool.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* 核心操作区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-surface-2/40 border border-hairline p-4 sm:p-5 rounded-xl">
        {/* 左侧：文件选择 */}
        <div>
          <label className="block text-[11px] font-medium text-ink-tertiary mb-2 uppercase tracking-wider">
            1. 选择操作文件 ({selectedTool === "merge" ? "支持多选" : "单选"})
          </label>
          <div className="border border-dashed border-hairline hover:border-hairline-strong rounded-xl p-6 text-center cursor-pointer relative bg-surface-1 hover:bg-surface-2/50 transition-colors group">
            <input
              type="file"
              multiple={selectedTool === "merge"}
              accept={
                selectedTool === "ocr" || selectedTool === "searchable"
                  ? ".pdf,.jpg,.jpeg,.png,.webp"
                  : ".pdf"
              }
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle group-hover:text-primary group-hover:border-primary/40 transition-colors">
              <Upload className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <span className="text-xs text-ink block font-medium">
              点击或拖入待处理文件
            </span>
            <span className="text-[11px] text-ink-tertiary block mt-1">
              {selectedTool === "ocr" || selectedTool === "searchable"
                ? "支持 PDF、JPG、PNG、WEBP"
                : "仅支持 .pdf 格式"}
            </span>
          </div>

          {files.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-surface-1 px-3 py-1.5 rounded-md border border-hairline"
                >
                  <span className="truncate text-ink font-mono text-[12px]">{f.name}</span>
                  <span className="text-ink-tertiary text-[11px] shrink-0 ml-2 font-mono">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：专属参数配置 */}
        <div>
          <label className="block text-[11px] font-medium text-ink-tertiary mb-2 uppercase tracking-wider">
            2. 参数配置
          </label>

          <div className="bg-surface-1 border border-hairline rounded-xl p-4 sm:p-5 space-y-4">
            {selectedTool === "merge" && (
              <p className="text-xs text-ink-subtle leading-relaxed">
                将按照选定文件的排列顺序依次拼接为一个完整的 PDF。支持任意页数合并。
              </p>
            )}

            {selectedTool === "split" && (
              <div className="space-y-3">
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-ink-muted cursor-pointer">
                    <input
                      type="radio"
                      checked={splitMode === "ranges"}
                      onChange={() => setSplitMode("ranges")}
                      className="accent-primary"
                    />
                    提取指定范围
                  </label>
                  <label className="flex items-center gap-1.5 text-ink-muted cursor-pointer">
                    <input
                      type="radio"
                      checked={splitMode === "each"}
                      onChange={() => setSplitMode("each")}
                      className="accent-primary"
                    />
                    每页独立拆分为 ZIP 包
                  </label>
                </div>
                {splitMode === "ranges" && (
                  <div>
                    <label className="text-xs text-ink-subtle block mb-1">
                      提取页码（例如: 1,3-5）
                    </label>
                    <input
                      type="text"
                      value={splitRanges}
                      onChange={(e) => setSplitRanges(e.target.value)}
                      placeholder="1,3-5"
                      className="w-full bg-surface-2 border border-hairline hover:border-hairline-strong focus:border-primary/70 rounded-md px-3 py-1.5 text-xs text-ink focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            )}

            {selectedTool === "rotate" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-ink-subtle block mb-1">顺时针旋转角度</label>
                  <select
                    value={rotateAngle}
                    onChange={(e) => setRotateAngle(Number(e.target.value))}
                    className="w-full bg-surface-2 border border-hairline hover:border-hairline-strong rounded-md px-3 py-1.5 text-xs text-ink focus:outline-none transition-colors"
                  >
                    <option value={90} className="bg-surface-3 text-ink">90° (顺时针向右)</option>
                    <option value={180} className="bg-surface-3 text-ink">180° (倒置翻转)</option>
                    <option value={270} className="bg-surface-3 text-ink">270° (逆时针向左)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ink-subtle block mb-1">
                    目标页（填写 all 或具体页码如 1,3）
                  </label>
                  <input
                    type="text"
                    value={rotatePages}
                    onChange={(e) => setRotatePages(e.target.value)}
                    className="w-full bg-surface-2 border border-hairline hover:border-hairline-strong rounded-md px-3 py-1.5 text-xs text-ink focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {selectedTool === "compress" && (
              <div>
                <label className="text-xs text-ink-subtle block mb-1">压缩模式</label>
                <select
                  value={compressLevel}
                  onChange={(e) => setCompressLevel(e.target.value)}
                  className="w-full bg-surface-2 border border-hairline hover:border-hairline-strong rounded-md px-3 py-1.5 text-xs text-ink focus:outline-none transition-colors"
                >
                  <option value="low" className="bg-surface-3 text-ink">轻度压缩 (保留最高画质)</option>
                  <option value="medium" className="bg-surface-3 text-ink">推荐压缩 (平衡文件体积与清晰度)</option>
                  <option value="high" className="bg-surface-3 text-ink">强力压缩 (最大限度缩减体积)</option>
                </select>
              </div>
            )}

            {selectedTool === "security" && (
              <div className="space-y-3">
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-ink-muted cursor-pointer">
                    <input
                      type="radio"
                      checked={securityAction === "encrypt"}
                      onChange={() => setSecurityAction("encrypt")}
                      className="accent-primary"
                    />
                    添加密码加密 (AES-256)
                  </label>
                  <label className="flex items-center gap-1.5 text-ink-muted cursor-pointer">
                    <input
                      type="radio"
                      checked={securityAction === "decrypt"}
                      onChange={() => setSecurityAction("decrypt")}
                      className="accent-primary"
                    />
                    解密并移除密码
                  </label>
                </div>
                <div>
                  <label className="text-xs text-ink-subtle block mb-1">
                    {securityAction === "encrypt" ? "设置打开密码" : "输入原密码以解除"}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入口令..."
                    className="w-full bg-surface-2 border border-hairline hover:border-hairline-strong focus:border-primary/70 rounded-md px-3 py-1.5 text-xs text-ink focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {selectedTool === "watermark" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-ink-subtle block mb-1">水印文字内容</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full bg-surface-2 border border-hairline hover:border-hairline-strong focus:border-primary/70 rounded-md px-3 py-1.5 text-xs text-ink focus:outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-ink-subtle block mb-1">
                      透明度 ({Math.round(watermarkOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-ink-subtle block mb-1">倾斜角 ({watermarkRotation}°)</label>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="15"
                      value={watermarkRotation}
                      onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedTool === "searchable" && (
              <div className="space-y-3">
                <p className="text-xs text-ink-subtle leading-relaxed">
                  使用 PaddleOCR 引擎识别扫描件文字，在图像上方精确叠加一层隐形文字图层。生成后的 PDF 保留原图视觉，同时支持鼠标划选、复制以及 Ctrl+F 全文查找！
                </p>
                <div>
                  <label className="text-xs text-ink-subtle block mb-1">扫描识别精度 (DPI)</label>
                  <select
                    value={searchableDpi}
                    onChange={(e) => setSearchableDpi(Number(e.target.value))}
                    className="w-full bg-surface-2 border border-hairline hover:border-hairline-strong rounded-md px-3 py-1.5 text-xs text-ink focus:outline-none transition-colors"
                  >
                    <option value={150} className="bg-surface-3 text-ink">150 DPI (快速)</option>
                    <option value={200} className="bg-surface-3 text-ink">200 DPI (推荐，平衡速度与精准度)</option>
                    <option value={300} className="bg-surface-3 text-ink">300 DPI (高清精确度)</option>
                  </select>
                </div>
              </div>
            )}

            {selectedTool === "ocr" && (
              <div className="space-y-3">
                <p className="text-xs text-ink-subtle leading-relaxed">
                  提取图片或扫描件中的所有文字，自动保留页面分块并排版输出。
                </p>
                <div>
                  <label className="text-xs text-ink-subtle block mb-1">导出目标格式</label>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 text-ink-muted cursor-pointer">
                      <input
                        type="radio"
                        checked={ocrFormat === "docx"}
                        onChange={() => setOcrFormat("docx")}
                        className="accent-primary"
                      />
                      导出为 Word (.docx)
                    </label>
                    <label className="flex items-center gap-1.5 text-ink-muted cursor-pointer">
                      <input
                        type="radio"
                        checked={ocrFormat === "txt"}
                        onChange={() => setOcrFormat("txt")}
                        className="accent-primary"
                      />
                      导出为纯文本 (.txt)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 执行按钮 */}
            <button
              onClick={handleExecute}
              disabled={isProcessing || files.length === 0}
              className="w-full py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-150 disabled:opacity-40 shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                  正在处理中 (OCR 或大文件可能需数秒)...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                  立即开始处理
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {/* 处理结果展示 */}
      {currentTask && currentTask.status === "completed" && currentTask.output_filename && (
        <div className="mt-4 p-4 bg-surface-2 border border-emerald-500/30 rounded-xl flex items-center justify-between shadow-none">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
            <div>
              <div className="text-xs font-medium text-ink">处理完成！</div>
              <div className="text-[11px] text-ink-subtle font-mono">{currentTask.output_filename}</div>
            </div>
          </div>
          <a
            href={getDownloadUrl(currentTask.task_id, currentTask.output_filename)}
            download={currentTask.output_filename}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-medium transition-all duration-150"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            下载结果文件
          </a>
        </div>
      )}
    </div>
  );
};
