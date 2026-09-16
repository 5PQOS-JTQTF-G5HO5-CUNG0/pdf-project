"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  subText?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  accept = ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png,.webp",
  subText = "支持 Word、Excel、PPT、PDF、JPG、PNG、WEBP 等格式（最大 500 MB）",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = ""; // 清空以便支持重复选取同名文件
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-150 ease-out bg-surface-1 group relative overflow-hidden ${
        isDragging
          ? "border-primary bg-surface-2 ring-1 ring-primary/30"
          : "border-hairline hover:border-hairline-strong hover:bg-surface-2/40"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* 微妙的顶部环境微光 (Linear ambient highlight) */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

      {/* 拖拽中心图标容器 */}
      <div className="w-11 h-11 mx-auto mb-3.5 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle group-hover:text-primary group-hover:border-primary/40 group-hover:bg-surface-3 transition-all duration-150">
        <UploadCloud className="w-5 h-5" strokeWidth={1.75} />
      </div>

      <h3 className="text-sm font-medium text-ink tracking-tight mb-1">
        拖拽文件到此处，或{" "}
        <span className="text-primary group-hover:text-primary-hover transition-colors underline underline-offset-4 decoration-primary/40">
          点击选取文件
        </span>
      </h3>
      <p className="text-xs text-ink-subtle max-w-md mx-auto leading-relaxed">
        {subText}
      </p>

      {/* 底部特性 micro-badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-[11px] text-ink-tertiary">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
          多文件并行处理
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
          本地容器隐私隔离
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
          定时自动物理销毁
        </span>
      </div>
    </div>
  );
};
