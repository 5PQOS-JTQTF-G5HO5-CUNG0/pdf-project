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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-3 border border-hairline rounded-xl w-full max-w-lg p-5 shadow-none animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3.5 border-b border-hairline">
          <h2 className="text-sm font-medium text-ink tracking-tight">全局偏好设置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs">
          {/* 渲染 DPI */}
          <div>
            <label className="text-ink-muted font-medium block mb-1.5">
              PDF 转图片基准清晰度 (DPI)
            </label>
            <select
              value={settings.default_dpi}
              onChange={(e) =>
                setSettings({ ...settings, default_dpi: Number(e.target.value) })
              }
              className="w-full bg-surface-1 border border-hairline hover:border-hairline-strong focus:border-primary/70 rounded-md px-3 py-2 text-ink focus:outline-none transition-colors"
            >
              <option value={150} className="bg-surface-2 text-ink">150 DPI (轻巧快速)</option>
              <option value={300} className="bg-surface-2 text-ink">300 DPI (高清标准推荐)</option>
              <option value={600} className="bg-surface-2 text-ink">600 DPI (超高清打印级)</option>
            </select>
          </div>

          {/* 成功文件自动删除时间 */}
          <div>
            <label className="text-ink-muted font-medium block mb-1.5">
              成功任务产物自动销毁时间 (小时)
            </label>
            <input
              type="number"
              min={1}
              max={72}
              value={settings.cleanup_success_hours}
              onChange={(e) =>
                setSettings({ ...settings, cleanup_success_hours: Number(e.target.value) })
              }
              className="w-full bg-surface-1 border border-hairline hover:border-hairline-strong focus:border-primary/70 rounded-md px-3 py-2 text-ink focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-ink-tertiary mt-1">
              遵循本地零沉淀安全规范，超出该时间的文件将从临时目录彻底清除。
            </p>
          </div>

          {/* 失败任务保留时间 */}
          <div>
            <label className="text-ink-muted font-medium block mb-1.5">
              失败/异常任务临时目录清理时间 (小时)
            </label>
            <input
              type="number"
              min={1}
              max={168}
              value={settings.cleanup_failed_hours}
              onChange={(e) =>
                setSettings({ ...settings, cleanup_failed_hours: Number(e.target.value) })
              }
              className="w-full bg-surface-1 border border-hairline hover:border-hairline-strong focus:border-primary/70 rounded-md px-3 py-2 text-ink focus:outline-none transition-colors"
            />
          </div>

          {/* 最大文件体积 */}
          <div>
            <label className="text-ink-muted font-medium block mb-1.5">
              单文件最大允许体积 (MB)
            </label>
            <input
              type="number"
              min={50}
              max={2048}
              value={settings.max_file_size_mb}
              onChange={(e) =>
                setSettings({ ...settings, max_file_size_mb: Number(e.target.value) })
              }
              className="w-full bg-surface-1 border border-hairline hover:border-hairline-strong focus:border-primary/70 rounded-md px-3 py-2 text-ink focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="pt-3.5 border-t border-hairline flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-1 text-ink-muted hover:text-ink border border-hairline text-xs font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all duration-150 shadow-sm disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2} />
                已保存
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
                保存偏好
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
