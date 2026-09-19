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
  Play,
  Check,
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
  const [watermarkAction, setWatermarkAction] = useState<"add" | "remove">("add");
  const [watermarkText, setWatermarkText] = useState("机密文件 请勿外传");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkRotation, setWatermarkRotation] = useState(45);
  const [searchableDpi, setSearchableDpi] = useState(200);
  const [ocrFormat, setOcrFormat] = useState<"docx" | "txt">("docx");

  // 去水印专属状态 (完整保留)
  const [unwatermarkMode, setUnwatermarkMode] = useState<"text" | "layer" | "area" | "all">("text");
  const [unwatermarkKeywords, setUnwatermarkKeywords] = useState("");
  const [unwatermarkCaseSensitive, setUnwatermarkCaseSensitive] = useState(false);
  const [unwatermarkFillMode, setUnwatermarkFillMode] = useState<"none" | "white">("none");
  const [unwatermarkCleanArtifacts, setUnwatermarkCleanArtifacts] = useState(true);
  const [unwatermarkCleanImages, setUnwatermarkCleanImages] = useState(false);
  const [unwatermarkAreaType, setUnwatermarkAreaType] = useState<"header" | "footer" | "both">("header");
  const [unwatermarkAreaRatio, setUnwatermarkAreaRatio] = useState(0.08);

  const toolsList = [
    { id: "merge", name: "合并 PDF", enName: "Merge", icon: Layers, desc: "将多个 PDF 文件按先后顺序拼接合成完整文档。" },
    { id: "split", name: "拆分 / 提取", enName: "Split", icon: Scissors, desc: "按页码范围精确提取或将每页拆分为独立单页。" },
    { id: "rotate", name: "页面旋转", enName: "Rotate", icon: RotateCw, desc: "多角度纠正页面朝向，支持顺逆时针与翻转。" },
    { id: "compress", name: "体积压缩", enName: "Compress", icon: Minimize2, desc: "智能优化图层与高分辨率流，极速释放体积。" },
    { id: "security", name: "加密与解密", enName: "Security", icon: Lock, desc: "工业级 AES-256 口令保护与解除权限限制。" },
    { id: "watermark", name: "水印处理与擦除", enName: "Watermark", icon: Stamp, desc: "支持添加半透明倾斜水印，或按文本/浮层智能去水印。" },
    { id: "searchable", name: "可搜索 PDF", enName: "Searchable", icon: FileSearch, desc: "OCR 精准叠加隐形文字层，支持全文划选查找。" },
    { id: "ocr", name: "OCR 提取文字", enName: "OCR Text", icon: ScanText, desc: "智能识别扫描图像排版，直接导出为 Word 或纯文本。" },
  ];

  const currentToolInfo = toolsList.find((t) => t.id === selectedTool)!;

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

    let action: string = selectedTool;
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
      if (watermarkAction === "add") {
        if (!watermarkText.trim()) {
          setError("水印文字不能为空。");
          setIsProcessing(false);
          return;
        }
        action = "watermark";
        options.text = watermarkText;
        options.opacity = watermarkOpacity;
        options.rotation = watermarkRotation;
      } else {
        if (unwatermarkMode === "text" && !unwatermarkKeywords.trim()) {
          setError("请输入需要移除的水印文字或关键词。");
          setIsProcessing(false);
          return;
        }
        action = "remove_watermark";
        options.mode = unwatermarkMode;
        options.keywords = unwatermarkKeywords;
        options.case_sensitive = unwatermarkCaseSensitive;
        options.fill_mode = unwatermarkFillMode;
        options.clean_artifacts = unwatermarkCleanArtifacts;
        options.clean_image_watermark = unwatermarkCleanImages;
        if (unwatermarkMode === "area" || unwatermarkMode === "all") {
          options.area_type = unwatermarkAreaType;
          options.area_ratio = unwatermarkAreaRatio;
        }
      }
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
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
      {/* 左侧 macOS 侧边栏式工具导航 */}
      <div className="flex flex-col gap-1.5 bg-white/70 backdrop-blur-xl p-2.5 rounded-3xl border border-black/[0.04] shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-[#86868b] uppercase">
          PDF 工具库
        </div>
        {toolsList.map((tool) => {
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-150 ${
                active
                  ? "bg-[#0071e3] text-white shadow-[0_2px_10px_rgba(0,113,227,0.3)] scale-[1.01]"
                  : "hover:bg-black/[0.04] text-[#1d1d1f]"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  active ? "bg-white/20 text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-semibold truncate ${active ? "text-white" : "text-[#1d1d1f]"}`}>
                  {tool.name}
                </div>
                <div className={`text-[11px] truncate ${active ? "text-white/80" : "text-[#86868b]"}`}>
                  {tool.enName}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 右侧苹果风格详情面板 */}
      <div className="bg-white border border-black/[0.04] rounded-3xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.02)]">
        {/* 标题区 */}
        <div className="mb-6 pb-4 border-b border-black/[0.04]">
          <h2 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
            {currentToolInfo.name}
          </h2>
          <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
            {currentToolInfo.desc}
          </p>
        </div>

        {/* 1. 文件选择区 */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#1d1d1f] mb-2.5">
            1. 选择待处理文件 ({selectedTool === "merge" ? "支持多文件" : "单文件"})
          </label>
          <div className="border-2 border-dashed border-[#e5e5e7] hover:border-[#0071e3] rounded-2xl p-7 text-center cursor-pointer relative bg-[#f5f5f7]/50 hover:bg-[#0071e3]/[0.02] transition-all group">
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
            <div className="w-11 h-11 mx-auto mb-2.5 rounded-2xl bg-white border border-black/[0.04] flex items-center justify-center text-[#1d1d1f] shadow-xs group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5 text-[#0071e3]" strokeWidth={2} />
            </div>
            <span className="text-xs text-[#1d1d1f] font-semibold block">
              点击或拖入待处理文件
            </span>
            <span className="text-[11px] text-[#86868b] block mt-0.5">
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
                  className="flex items-center justify-between text-xs bg-[#f5f5f7] px-3.5 py-2 rounded-xl border border-black/[0.03]"
                >
                  <span className="truncate text-[#1d1d1f] font-mono text-[12px]">{f.name}</span>
                  <span className="text-[#86868b] text-[11px] shrink-0 ml-2 font-mono">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. 专属配置区 */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
            2. 专属参数设置
          </label>

          {selectedTool === "merge" && (
            <div className="text-xs text-[#86868b] leading-relaxed bg-[#f5f5f7] p-4 rounded-2xl">
              将按照所选文件的顺序依次拼接为一个完整的 PDF 文档。原生保持高分辨率排版，100% 矢量无损。
            </div>
          )}

          {selectedTool === "split" && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 bg-[#f5f5f7] p-1 rounded-full border border-black/[0.04] max-w-sm">
                <button
                  type="button"
                  onClick={() => setSplitMode("ranges")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                    splitMode === "ranges"
                      ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  提取指定范围
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode("each")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                    splitMode === "each"
                      ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  每页拆为 ZIP 包
                </button>
              </div>

              {splitMode === "ranges" && (
                <div>
                  <label className="text-xs font-medium text-[#86868b] block mb-1.5">
                    提取页码范围 (如: 1, 3-5)
                  </label>
                  <input
                    type="text"
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    placeholder="1-3"
                    className="w-full max-w-md bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {selectedTool === "rotate" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#86868b] block mb-1.5">顺时针旋转角度</label>
                <select
                  value={rotateAngle}
                  onChange={(e) => setRotateAngle(Number(e.target.value))}
                  className="w-full max-w-md bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                >
                  <option value={90}>90° (顺时针向右)</option>
                  <option value={180}>180° (倒置翻转)</option>
                  <option value={270}>270° (逆时针向左)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#86868b] block mb-1.5">
                  目标页码 (填写 all 或具体页如 1, 3)
                </label>
                <input
                  type="text"
                  value={rotatePages}
                  onChange={(e) => setRotatePages(e.target.value)}
                  className="w-full max-w-md bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {selectedTool === "compress" && (
            <div>
              <label className="text-xs font-medium text-[#86868b] block mb-1.5">压缩等级</label>
              <select
                value={compressLevel}
                onChange={(e) => setCompressLevel(e.target.value)}
                className="w-full max-w-md bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
              >
                <option value="low">轻度压缩 (保留最清晰画质)</option>
                <option value="medium">标准压缩 (推荐，平衡画质与体积)</option>
                <option value="high">强力压缩 (极速大幅缩小体积)</option>
              </select>
            </div>
          )}

          {selectedTool === "security" && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 bg-[#f5f5f7] p-1 rounded-full border border-black/[0.04] max-w-sm">
                <button
                  type="button"
                  onClick={() => setSecurityAction("encrypt")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                    securityAction === "encrypt"
                      ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  添加密码保护 (AES)
                </button>
                <button
                  type="button"
                  onClick={() => setSecurityAction("decrypt")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                    securityAction === "decrypt"
                      ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  解密并移除密码
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-[#86868b] block mb-1.5">
                  {securityAction === "encrypt" ? "设置打开口令" : "输入原密码以解密"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入口令..."
                  className="w-full max-w-md bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* 水印与智能去水印（功能完全保留并适配苹果胶囊样式） */}
          {selectedTool === "watermark" && (
            <div className="space-y-4">
              {/* 苹果分段控制器 */}
              <div className="flex items-center gap-2 bg-[#f5f5f7] p-1 rounded-full border border-black/[0.04] max-w-md">
                <button
                  type="button"
                  onClick={() => setWatermarkAction("add")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                    watermarkAction === "add"
                      ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  添加半透明防伪水印
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkAction("remove")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                    watermarkAction === "remove"
                      ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  智能去除水印
                </button>
              </div>

              {watermarkAction === "add" ? (
                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="text-xs font-medium text-[#86868b] block mb-1.5">水印文字内容</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full max-w-md bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-w-md text-xs">
                    <div>
                      <label className="text-[#86868b] font-medium block mb-1.5">
                        透明度 ({Math.round(watermarkOpacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-[#0071e3]"
                      />
                    </div>
                    <div>
                      <label className="text-[#86868b] font-medium block mb-1.5">倾斜角 ({watermarkRotation}°)</label>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="15"
                        value={watermarkRotation}
                        onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                        className="w-full accent-[#0071e3]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-medium text-[#86868b] block mb-2">去水印模式</label>
                    <div className="grid grid-cols-2 gap-2.5 max-w-md text-xs">
                      {[
                        { id: "text", name: "文本匹配抹除", desc: "指定关键词底层消除" },
                        { id: "layer", name: "智能浮层清理", desc: "清理 XObject/标记" },
                        { id: "area", name: "页面区域擦除", desc: "页眉/页脚边距擦除" },
                        { id: "all", name: "全能组合清理", desc: "文本+浮层+区域" },
                      ].map((m) => {
                        const isCur = unwatermarkMode === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setUnwatermarkMode(m.id as any)}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              isCur
                                ? "bg-white border-[#0071e3] ring-2 ring-[#0071e3]/20 shadow-xs"
                                : "bg-[#f5f5f7] border-black/[0.03] hover:bg-[#ececee] text-[#1d1d1f]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#1d1d1f]">{m.name}</span>
                              {isCur && <Check className="w-3.5 h-3.5 text-[#0071e3]" strokeWidth={2.5} />}
                            </div>
                            <div className="text-[11px] text-[#86868b] mt-0.5 truncate">
                              {m.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(unwatermarkMode === "text" || unwatermarkMode === "all") && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between items-center mb-1.5 max-w-md">
                          <label className="text-xs font-medium text-[#86868b]">水印文字 / 关键词</label>
                          <span className="text-[11px] text-[#86868b]">多个用逗号隔开</span>
                        </div>
                        <input
                          type="text"
                          value={unwatermarkKeywords}
                          onChange={(e) => setUnwatermarkKeywords(e.target.value)}
                          placeholder="例如：机密, 内部传阅, DRAFT, 仅供参考"
                          className="w-full max-w-md bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 max-w-md text-xs">
                        <div>
                          <label className="text-[#86868b] font-medium block mb-1.5">擦除方式</label>
                          <select
                            value={unwatermarkFillMode}
                            onChange={(e) => setUnwatermarkFillMode(e.target.value as any)}
                            className="w-full bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                          >
                            <option value="none">无痕擦除 (清除矢量流)</option>
                            <option value="white">纯白遮盖 (Whiteout)</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-6">
                          <label className="flex items-center gap-2 text-xs text-[#1d1d1f] cursor-pointer font-medium">
                            <input
                              type="checkbox"
                              checked={!unwatermarkCaseSensitive}
                              onChange={(e) => setUnwatermarkCaseSensitive(!e.target.checked)}
                              className="accent-[#0071e3] rounded"
                            />
                            忽略英文大小写
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {(unwatermarkMode === "layer" || unwatermarkMode === "all") && (
                    <div className="space-y-2.5 pt-2 text-xs">
                      <label className="text-xs font-semibold text-[#1d1d1f] block">浮层水印与对象清理</label>
                      <label className="flex items-center gap-2 text-[#1d1d1f] cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={unwatermarkCleanArtifacts}
                          onChange={(e) => setUnwatermarkCleanArtifacts(e.target.checked)}
                          className="accent-[#0071e3] rounded"
                        />
                        自动移除 /Artifact 结构标记与 Form XObject 水印对象
                      </label>
                      <label className="flex items-center gap-2 text-[#1d1d1f] cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={unwatermarkCleanImages}
                          onChange={(e) => setUnwatermarkCleanImages(e.target.checked)}
                          className="accent-[#0071e3] rounded"
                        />
                        清理整页半透明背景图片水印 (若整页作为图片底图)
                      </label>
                    </div>
                  )}

                  {(unwatermarkMode === "area" || unwatermarkMode === "all") && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3 max-w-md text-xs">
                        <div>
                          <label className="text-[#86868b] font-medium block mb-1.5">擦除目标区域</label>
                          <select
                            value={unwatermarkAreaType}
                            onChange={(e) => setUnwatermarkAreaType(e.target.value as any)}
                            className="w-full bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                          >
                            <option value="header">仅清除页眉区域</option>
                            <option value="footer">仅清除页脚区域</option>
                            <option value="both">同时清除页眉和页脚</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[#86868b] font-medium block mb-1.5">
                            区域高度 ({Math.round(unwatermarkAreaRatio * 100)}%)
                          </label>
                          <select
                            value={unwatermarkAreaRatio}
                            onChange={(e) => setUnwatermarkAreaRatio(parseFloat(e.target.value))}
                            className="w-full bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                          >
                            <option value={0.05}>顶部/底部 5%</option>
                            <option value={0.08}>顶部/底部 8% (常用)</option>
                            <option value={0.12}>顶部/底部 12%</option>
                            <option value={0.18}>顶部/底部 18% (大范围)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedTool === "searchable" && (
            <div className="space-y-3.5">
              <p className="text-xs text-[#86868b] leading-relaxed bg-[#f5f5f7] p-4 rounded-2xl">
                使用 PaddleOCR 引擎识别扫描件文字，在图像上方精准叠加透明文字层。生成后的 PDF 保持原图质感，同时支持划选、复制与全文检索！
              </p>
              <div>
                <label className="text-xs font-medium text-[#86868b] block mb-1.5">扫描识别精度 (DPI)</label>
                <select
                  value={searchableDpi}
                  onChange={(e) => setSearchableDpi(Number(e.target.value))}
                  className="w-full max-w-md bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-xs text-[#1d1d1f] focus:outline-none transition-all"
                >
                  <option value={150}>150 DPI (轻巧快速)</option>
                  <option value={200}>200 DPI (推荐，平衡速度与精准度)</option>
                  <option value={300}>300 DPI (高清专业级)</option>
                </select>
              </div>
            </div>
          )}

          {selectedTool === "ocr" && (
            <div className="space-y-3.5">
              <p className="text-xs text-[#86868b] leading-relaxed bg-[#f5f5f7] p-4 rounded-2xl">
                提取扫描件或图片中的全部文本，自动保留段落分块与表格结构。
              </p>
              <div>
                <label className="text-xs font-medium text-[#86868b] block mb-2">导出格式</label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2 text-[#1d1d1f] cursor-pointer font-medium">
                    <input
                      type="radio"
                      checked={ocrFormat === "docx"}
                      onChange={() => setOcrFormat("docx")}
                      className="accent-[#0071e3]"
                    />
                    导出为 Word (.docx)
                  </label>
                  <label className="flex items-center gap-2 text-[#1d1d1f] cursor-pointer font-medium">
                    <input
                      type="radio"
                      checked={ocrFormat === "txt"}
                      onChange={() => setOcrFormat("txt")}
                      className="accent-[#0071e3]"
                    />
                    导出为纯文本 (.txt)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 执行按钮区 */}
        <div className="mt-8 pt-5 border-t border-black/[0.04] flex items-center gap-3.5">
          <button
            onClick={handleExecute}
            disabled={isProcessing || files.length === 0}
            className="px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                正在处理中...
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                立即开始处理
              </>
            )}
          </button>
          <span className="text-xs text-[#86868b]">
            {files.length > 0 ? `已选 ${files.length} 个文件` : "请先选取操作文件"}
          </span>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-[#ff3b30] text-xs flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ff3b30]" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* 处理结果展示 */}
        {currentTask && currentTask.status === "completed" && currentTask.output_filename && (
          <div className="mt-5 p-4 sm:p-5 bg-[#34c759]/10 border border-[#34c759]/20 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#34c759]" strokeWidth={2} />
              <div>
                <div className="text-xs font-semibold text-[#1d1d1f]">处理完成！</div>
                <div className="text-[11px] text-[#86868b] font-mono">{currentTask.output_filename}</div>
              </div>
            </div>
            <a
              href={getDownloadUrl(currentTask.task_id, currentTask.output_filename)}
              download={currentTask.output_filename}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#34c759] hover:bg-[#2fb350] text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              下载结果
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
