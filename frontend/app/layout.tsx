import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalPDF - 本地安全文件转换与 PDF 工具箱",
  description: "纯本地运行、零云端上传的 Windows 私人文件与 PDF 转换工作站",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
