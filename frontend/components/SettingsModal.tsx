"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Check } from "lucide-react";
import { getSettings, updateSettings, AppSettings } from "@/lib/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    default_format: "pdf",
    default_dpi: 300,
    cleanup_success_hours: 1,
    cleanup_failed_hours: 24,
    max_file_size_mb: 500,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getSettings()
        .then((res) => setSettings(res))
        .catch(() => {});
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      alert("保存设置失败");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl border border-black/[0.06] rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.12)] animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.04]">
          <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">全局偏好设置</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#1d1d1f] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs">
          {/* 渲染 DPI */}
          <div>
            <label className="text-[#1d1d1f] font-semibold block mb-1.5">
              PDF 转图片基准清晰度 (DPI)
            </label>
            <select
              value={settings.default_dpi}
              onChange={(e) =>
                setSettings({ ...settings, default_dpi: Number(e.target.value) })
              }
              className="w-full bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-[#1d1d1f] focus:outline-none transition-all font-medium"
            >
              <option value={150}>150 DPI (轻巧快速)</option>
              <option value={300}>300 DPI (高清专业推荐)</option>
              <option value={600}>600 DPI (超高清印刷级)</option>
            </select>
          </div>

          {/* 成功文件自动删除时间 */}
          <div>
            <label className="text-[#1d1d1f] font-semibold block mb-1.5">
              产物自动物理销毁时间 (小时)
            </label>
            <input
              type="number"
              min={1}
              max={72}
              value={settings.cleanup_success_hours}
              onChange={(e) =>
                setSettings({ ...settings, cleanup_success_hours: Number(e.target.value) })
              }
              className="w-full bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-[#1d1d1f] focus:outline-none transition-all font-medium"
            />
            <p className="text-[11px] text-[#86868b] mt-1">
              本地沙箱零沉淀设计，超时将彻底清理释放磁盘。
            </p>
          </div>

          {/* 失败任务保留时间 */}
          <div>
            <label className="text-[#1d1d1f] font-semibold block mb-1.5">
              失败异常任务临时保留时间 (小时)
            </label>
            <input
              type="number"
              min={1}
              max={168}
              value={settings.cleanup_failed_hours}
              onChange={(e) =>
                setSettings({ ...settings, cleanup_failed_hours: Number(e.target.value) })
              }
              className="w-full bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-[#1d1d1f] focus:outline-none transition-all font-medium"
            />
          </div>

          {/* 最大文件体积 */}
          <div>
            <label className="text-[#1d1d1f] font-semibold block mb-1.5">
              单文件最大允许上限 (MB)
            </label>
            <input
              type="number"
              min={50}
              max={2048}
              value={settings.max_file_size_mb}
              onChange={(e) =>
                setSettings({ ...settings, max_file_size_mb: Number(e.target.value) })
              }
              className="w-full bg-[#f5f5f7] border border-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-3.5 py-2 text-[#1d1d1f] focus:outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-black/[0.04] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold transition-all active:scale-95"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                已保存
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" strokeWidth={2} />
                保存偏好
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
