"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, ArrowUpRight } from "lucide-react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  subText?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  accept = ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png,.webp",
  subText = "支持 Word、Excel、PPT、PDF 以及各类高清图片（单文件最大 500 MB）",
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
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] transition-all">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragging
            ? "border-[#0071e3] bg-[#0071e3]/[0.03] scale-[0.99]"
            : "border-[#e5e5e7] hover:border-[#86868b] hover:bg-[#fafafa]"
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

        {/* 苹果风格中心图标 */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-b from-[#f5f5f7] to-[#e8e8ed] border border-black/[0.04] flex items-center justify-center text-[#1d1d1f] shadow-sm group-hover:scale-105 transition-transform">
          <UploadCloud className="w-6 h-6 text-[#0071e3]" strokeWidth={2} />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-[#1d1d1f] tracking-tight mb-1.5">
          将文件拖入此处，或直接点击选取
        </h3>
        <p className="text-xs sm:text-sm text-[#86868b] max-w-md mx-auto leading-relaxed mb-5">
          {subText}
        </p>

        <button
          type="button"
          className="px-5 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-[#000000] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          选取本地文件
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>

        {/* 底部特性胶囊徽章 */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-8 pt-6 border-t border-black/[0.04] w-full text-xs text-[#86868b]">
          <span className="flex items-center gap-1.5 font-medium px-3 py-1 rounded-full bg-[#f5f5f7]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" strokeWidth={2} />
            并行高速处理
          </span>
          <span className="flex items-center gap-1.5 font-medium px-3 py-1 rounded-full bg-[#f5f5f7]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" strokeWidth={2} />
            端侧数据物理隔绝
          </span>
          <span className="flex items-center gap-1.5 font-medium px-3 py-1 rounded-full bg-[#f5f5f7]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" strokeWidth={2} />
            沙箱自动销毁
          </span>
        </div>
      </div>
    </div>
  );
};
