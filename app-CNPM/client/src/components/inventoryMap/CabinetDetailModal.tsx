import { useState } from "react";
import type { CabinetInfo } from "../../types/inventoryMap";
import { ROLES } from "../../constants/role";

interface Props {
  cabinet: CabinetInfo;
  userRole: string;
  onClose: () => void;
  onToggleFull: (key: string, isFull: boolean) => Promise<void>;
}

const STATUS_LABEL: Record<string, string> = {
  safe: "Còn hạn",
  near: "Cận date",
  expired: "Hết hạn",
  empty: "Trống",
};

const STATUS_COLOR: Record<string, string> = {
  safe: "#059669",
  near: "#F59E0B",
  expired: "#EF4444",
  empty: "#9CA3AF",
};

export default function CabinetDetailModal({
  cabinet,
  userRole,
  onClose,
  onToggleFull,
}: Props) {
  const [loading, setLoading] = useState(false);
  const isStorekeeper = userRole === ROLES.STOREKEEPER;

  const handleToggleFull = async () => {
    setLoading(true);
    try {
      await onToggleFull(cabinet.key, !cabinet.isFull);
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--surface-container)",
          border: "1px solid var(--outline-variant)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          animation: "fadeIn 0.18s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--outline-variant)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Vị trí
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--on-surface)",
                lineHeight: 1.2,
              }}
            >
              Tầng {cabinet.floor} · Phòng {cabinet.room} · {cabinet.label}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--on-surface-variant)",
                marginTop: 4,
              }}
            >
              {cabinet.isFull && (
                <span
                  style={{
                    background: "#EF4444",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "2px 8px",
                    display: "inline-block",
                  }}
                >
                  ĐẦY
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "var(--surface-container-high)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              color: "var(--on-surface-variant)",
              transition: "all 0.15s",
            }}
          >
            ✕
          </button>
        </div>

        {/* Drug list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {cabinet.drugs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--on-surface-variant)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📦</div>
              <div style={{ fontWeight: 600 }}>Tủ này hiện đang trống</div>
            </div>
          ) : (
            <>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 80px 100px", 
                padding: "0 12px 8px", 
                fontSize: "0.7rem", 
                fontWeight: 700, 
                color: "var(--on-surface-variant)", 
                textTransform: "uppercase",
                borderBottom: "1px solid var(--outline-variant)"
              }}>
                <span>Tên thuốc / Mã lô</span>
                <span style={{ textAlign: "center" }}>Số lượng</span>
                <span style={{ textAlign: "right" }}>Hạn dùng</span>
              </div>
              {cabinet.drugs.map((drug) => (
                <div 
                  key={drug.batchId} 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 80px 100px", 
                    padding: "10px 12px", 
                    alignItems: "center",
                    background: "var(--surface-container-high)",
                    borderRadius: 12,
                    fontSize: "0.85rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 700, color: "var(--on-surface)" }}>{drug.medicineName}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--on-surface-variant)" }}>{drug.batchCode}</span>
                  </div>
                  <div style={{ textAlign: "center", fontWeight: 800, color: "var(--primary)" }}>
                    {drug.quantity.toLocaleString()}
                  </div>
                  <div style={{ 
                    textAlign: "right", 
                    fontSize: "0.75rem", 
                    color: STATUS_COLOR[drug.status],
                    fontWeight: 600 
                  }}>
                    {new Date(drug.expiryDate).toLocaleDateString("vi-VN")}
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.8 }}>
                      {STATUS_LABEL[drug.status]}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer: storekeeper action */}
        {isStorekeeper && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--outline-variant)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--on-surface-variant)",
                fontWeight: 500,
              }}
            >
              {cabinet.isFull
                ? "Tủ đang được đánh dấu đầy"
                : "Đánh dấu trạng thái tủ"}
            </span>
            <button
              onClick={handleToggleFull}
              disabled={loading}
              style={{
                padding: "8px 20px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.85rem",
                background: cabinet.isFull ? "#EF4444" : "#059669",
                color: "#fff",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {loading
                ? "Đang cập nhật..."
                : cabinet.isFull
                  ? "✓ Bỏ đánh dấu đầy"
                  : "📦 Đánh dấu đã đầy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
