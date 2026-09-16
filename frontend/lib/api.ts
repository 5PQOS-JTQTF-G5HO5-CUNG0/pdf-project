export function getApiBase(): string {
  if (typeof window !== "undefined") {
    // 浏览器环境下直接走同源相对路径，完美兼容各类反代、域名与端口映射
    return "";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}

export interface TaskInfo {
  task_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  source_filename: string;
  target_format: string;
  output_filename?: string;
  download_url?: string;
  error_message?: string;
  created_at: number;
  finished_at?: number;
}

export interface ApiResponse {
  success: boolean;
  task_id?: string;
  filename?: string;
  download_url?: string;
  error_code?: string;
  message?: string;
}

export interface AppSettings {
  default_format: string;
  default_dpi: number;
  cleanup_success_hours: number;
  cleanup_failed_hours: number;
  max_file_size_mb: number;
}

export async function checkHealth() {
  const res = await fetch(`${getApiBase()}/api/health`);
  return res.json();
}

export async function getConversionMatrix(): Promise<Record<string, string[]>> {
  const res = await fetch(`${getApiBase()}/api/convert/matrix`);
  if (!res.ok) throw new Error("获取转换矩阵失败");
  return res.json();
}

export async function submitConvert(
  file: File,
  target: string,
  options?: Record<string, any>
): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target", target);
  if (options) {
    formData.append("options", JSON.stringify(options));
  }

  const res = await fetch(`${getApiBase()}/api/convert`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function submitPdfTool(
  action: string,
  files: File[],
  options?: Record<string, any>
): Promise<ApiResponse> {
  const formData = new FormData();
  for (const f of files) {
    formData.append("files", f);
  }
  if (options) {
    formData.append("options", JSON.stringify(options));
  }

  const res = await fetch(`${getApiBase()}/api/pdf-tools/${action}`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function getTaskStatus(taskId: string): Promise<TaskInfo> {
  const res = await fetch(`${getApiBase()}/api/tasks/${taskId}`);
  if (!res.ok) throw new Error("获取任务状态失败");
  return res.json();
}

export function getDownloadUrl(taskId: string, filename: string): string {
  return `${getApiBase()}/api/files/${taskId}/${encodeURIComponent(filename)}`;
}

export async function triggerBatchDownload(taskIds: string[]): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/files/batch-download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_ids: taskIds }),
  });

  if (!res.ok) throw new Error("打包下载请求失败");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LocalPDF_Batch_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${getApiBase()}/api/settings`);
  if (!res.ok) throw new Error("获取系统设置失败");
  return res.json();
}

export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
  const res = await fetch(`${getApiBase()}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("更新系统设置失败");
  return res.json();
}
