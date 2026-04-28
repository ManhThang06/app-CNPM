import type { CSSProperties, ReactNode } from "react";

/* ─── Icon ───────────────────────────────────────────────────────────────────── */
interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  style?: CSSProperties;
  className?: string;
}
export function Icon({ name, size = 20, fill = false, style = {}, className = "" }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined${fill ? " icon-fill" : ""}${className ? ` ${className}` : ""}`}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  );
}

/* ─── StatusPill ─────────────────────────────────────────────────────────────── */
interface StatusPillProps {
  status: string;
  label?: string;
}
export function StatusPill({ status, label }: StatusPillProps) {
  const text = label || status?.replace(/_/g, " ");
  return <span className={`pill pill-${status}`}>{text}</span>;
}

/* ─── Card ───────────────────────────────────────────────────────────────────── */
interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}
export function Card({ children, style = {}, className = "" }: CardProps) {
  return (
    <div className={`metric-card ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ─── PageHeader ─────────────────────────────────────────────────────────────── */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

/* ─── MetricCard ─────────────────────────────────────────────────────────────── */
interface TrendProps {
  up: boolean;
  label: string;
}
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: TrendProps;
  color?: string;
  borderColor?: string;
}
export function MetricCard({
  label,
  value,
  icon,
  trend,
  color = "var(--primary)",
  borderColor,
}: MetricCardProps) {
  return (
    <div
      className="metric-card"
      style={{ borderBottom: borderColor ? `4px solid ${borderColor}` : undefined }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>
            {label}
          </div>
          <div
            className="font-headline"
            style={{ fontSize: "2rem", fontWeight: 800, color: "var(--on-surface)", lineHeight: 1 }}
          >
            {value}
          </div>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={22} style={{ color }} />
        </div>
      </div>
      {trend && (
        <div
          style={{
            marginTop: 12,
            fontSize: "0.75rem",
            color: "var(--on-surface-variant)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon
            name={trend.up ? "trending_up" : "trending_down"}
            size={14}
            style={{ color: trend.up ? "#059669" : "var(--error)" }}
          />
          {trend.label}
        </div>
      )}
    </div>
  );
}

/* ─── EmptyState ─────────────────────────────────────────────────────────────── */
interface EmptyStateProps {
  icon: string;
  message: string;
}
export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--on-surface-variant)" }}>
      <Icon name={icon} size={40} style={{ opacity: 0.3, marginBottom: 12, display: "block" }} />
      <p style={{ fontSize: "0.875rem" }}>{message}</p>
    </div>
  );
}

/* ─── Loader ─────────────────────────────────────────────────────────────────── */
export function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
      <div className="wms-spinner" />
    </div>
  );
}

/* ─── SearchBar ──────────────────────────────────────────────────────────────── */
interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}
export function SearchBar({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  style = {},
}: SearchBarProps) {
  return (
    <div style={{ position: "relative", ...style }}>
      <Icon
        name="search"
        size={16}
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--outline)",
          pointerEvents: "none",
        }}
      />
      <input
        className="wms-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: 36, width: "min(260px, 100%)" }}
      />
    </div>
  );
}
