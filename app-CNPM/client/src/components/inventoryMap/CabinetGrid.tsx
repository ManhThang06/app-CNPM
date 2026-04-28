import type { CabinetInfo, CabinetStatus } from "../../types/inventoryMap";

interface Props {
  room: string;          // "A" | "B" | "C"
  cabinets: CabinetInfo[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

const BG_COLOR: Record<CabinetStatus, string> = {
  safe:    "#059669",
  near:    "#F59E0B",
  expired: "#EF4444",
  empty:   "var(--surface-container-high)",
};

const TEXT_COLOR: Record<CabinetStatus, string> = {
  safe:    "#fff",
  near:    "#fff",
  expired: "#fff",
  empty:   "var(--on-surface-variant)",
};

export default function CabinetGrid({ room, cabinets, selectedKey, onSelect }: Props) {
  return (
    <div style={{
      flex: 1,
      background: "var(--surface-container-lowest)",
      border: "1px solid var(--outline-variant)",
      borderRadius: 16, padding: 20,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Room header */}
      <div style={{
        fontWeight: 800, fontSize: "0.95rem",
        color: "var(--on-surface)", marginBottom: 20,
        padding: "4px 16px", borderRadius: 8,
        background: "var(--surface-container-high)",
        letterSpacing: "0.05em",
      }}>
        PHÒNG {room}
      </div>

      {/* Cabinet grid: 5 cols × 2 rows = 10 cabinets */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, width: "100%" }}>
        {cabinets.map((cab) => {
          const isSelected = selectedKey === cab.key;
          const bg   = BG_COLOR[cab.status];
          const clr  = TEXT_COLOR[cab.status];
          const isDashed = cab.status === "empty";

          return (
            <div
              key={cab.key}
              onClick={() => onSelect(cab.key)}
              title={`${cab.label} · ${cab.totalQuantity} đv · ${cab.drugs.length} lô`}
              style={{
                position: "relative",
                width: "100%", aspectRatio: "1",
                borderRadius: 10,
                background: isDashed ? "transparent" : bg,
                border: isDashed
                  ? "2px dashed var(--outline)"
                  : isSelected
                    ? "3px solid #1D4ED8"
                    : "2px solid transparent",
                color: clr,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3,
                cursor: "pointer", fontWeight: 700, fontSize: "0.8rem",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(29,78,216,0.35)"
                  : "0 2px 4px rgba(0,0,0,0.06)",
                transform: isSelected ? "scale(1.08)" : "none",
                transition: "all 0.18s",
              }}
            >
              {/* Cabinet label */}
              <span>{cab.label}</span>

              {/* Quantity mini */}
              {cab.status !== "empty" && (
                <span style={{ fontSize: "0.62rem", opacity: 0.9, fontWeight: 500 }}>
                  {cab.totalQuantity > 999 ? `${(cab.totalQuantity / 1000).toFixed(1)}k` : cab.totalQuantity}
                </span>
              )}

              {/* Full badge */}
              {cab.isFull && (
                <span style={{
                  position: "absolute", top: -5, right: -5,
                  background: "#EF4444", color: "#fff",
                  fontSize: "0.52rem", fontWeight: 800,
                  padding: "1px 5px", borderRadius: 6,
                  border: "2px solid var(--surface-container)",
                  lineHeight: 1.4,
                }}>
                  FULL
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
