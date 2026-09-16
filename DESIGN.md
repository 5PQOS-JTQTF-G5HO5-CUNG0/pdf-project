---
version: 1.0
name: Clean-Figtree-Design-System
description: "High-contrast editorial light aesthetic. Warm off-white canvas (#fafafa), crisp black primary CTAs (#030303), Figtree typography, and spring physics micro-interactions."

colors:
  # 画布与表面（层次分明的纸质极简白）
  background: "#fafafa"       # 页面主底色（柔和暖灰白，杜绝刺眼纯白冷光）
  surface-card: "#ffffff"     # 卡片、弹窗与内容容器纯白底
  surface-secondary: "#f2f2f2"# 次级背景、灰底标签、分段控件未激活态
  surface-popover: "#ffffff"   # 下拉菜单、浮动 Popover

  # 文本层级（黑度精细分阶）
  foreground: "#030303"       # 主标题、核心加重文字（近全黑高对比）
  muted-foreground: "#555555" # 正文副标题、说明性文本、弱化元信息
  primary-foreground: "#ffffff"

  # 边框与控件线（1px 浅中灰细线）
  border: "#e4e4e4"           # 默认卡片边框与分割线
  input: "#e4e4e4"            # 输入框默认外边框
  ring: "#030303"             # 聚焦状态微光环 (Focus Ring)

  # 核心交互与品牌强调（黑金/冷蓝精密体系）
  primary: "#030303"          # 默认主 CTA（纯粹冷黑按钮）
  brand-primary: "#0a0a0a"    # 品牌核心暗色
  brand-blue: "#3476d8"       # 链接与功能性信息强调蓝
  brand-blue-hover: "#2868c7"
  brand-yellow: "#f8c808"     # 警示与高级会员金黄强调
  brand-yellow-hover: "#f0c106"
  brand-yellow-text: "#241900"
  brand-green: "#087868"      # 成功状态绿（复古墨绿，非荧光绿）
  destructive: "#a83634"      # 警示与危险操作红

typography:
  font-family: "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font-mono: "'JetBrains Mono', 'Fira Code', monospace"

  # 排版特征：紧凑字阶，标题采用平滑的负字距
  h1:
    size: "32px"
    weight: "700"
    tracking: "-0.03em"
    lineHeight: "1.2"
  h2:
    size: "22px"
    weight: "600"
    tracking: "-0.02em"
    lineHeight: "1.3"
  h3:
    size: "16px"
    weight: "600"
    tracking: "-0.01em"
    lineHeight: "1.4"
  body:
    size: "14px"
    weight: "400"
    tracking: "0"
    lineHeight: "1.5"
  caption:
    size: "12px"
    weight: "400"
    tracking: "0.01em"
    lineHeight: "1.4"

radii:
  base: "8px"    # 默认标准圆角 (--radius: 0.5rem)
  sm: "6px"      # 小型标签、徽章
  md: "8px"      # 按钮、表单输入框
  lg: "12px"     # 卡片外容器、弹窗
  pill: "9999px" # 搜索胶囊、圆角切换项

motion:
  # 标志性弹簧物理缓动（轻微回弹果冻感）
  ease-spring: "cubic-bezier(0.34, 1.56, 0.64, 1)"
  transition-fast: "all 150ms cubic-bezier(0.34, 1.56, 0.64, 1)"

components:
  card:
    bg: "var(--color-surface-card)"
    border: "1px solid var(--color-border)"
    radius: "var(--radii-lg)"
    padding: "20px 24px"
    shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" # 极其轻微的底色沉降

  button-primary:
    bg: "var(--color-primary)"
    text: "var(--color-primary-foreground)"
    radius: "var(--radii-md)"
    padding: "8px 16px"
    hover: "opacity: 0.9, transform: translateY(-1px)"
    transition: "var(--motion-transition-fast)"

  button-secondary:
    bg: "var(--color-surface-secondary)"
    text: "var(--color-foreground)"
    radius: "var(--radii-md)"
    padding: "8px 16px"
    hover: "bg: #e8e8e8"

  input:
    bg: "#ffffff"
    border: "1px solid var(--color-input)"
    text: "var(--color-foreground)"
    placeholder: "var(--color-muted-foreground)"
    focus-ring: "2px solid var(--color-ring)"
    radius: "var(--radii-md)"
    padding: "8px 12px"

rules:
  - "画布背景统一使用 #fafafa，卡片等内容容器使用 #ffffff，依靠微弱对比呈现层次。"
  - "主 CTA 按钮统一采用高对比的近纯黑（#030303），文字反白。"
  - "禁止使用模糊扩散的重黑阴影，卡片仅依赖 1px #e4e4e4 浅细线边框限定边界。"
  - "动画与交互必须配置弹簧曲线（cubic-bezier(0.34, 1.56, 0.64, 1)），体现精致的回弹质感。"
  - "彩色仅作为功能标识（蓝/黄/墨绿），严禁大面积使用彩色背景。"