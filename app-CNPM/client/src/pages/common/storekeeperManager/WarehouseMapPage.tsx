import { useState, useEffect, useCallback } from "react";
import { PageHeader, EmptyState } from "../../../components/UI";
import { useAppSelector } from "../../../app/hooks";
import { getInventoryMap, setCabinetFull } from "../../../api/inventoryMapApi";
import CabinetGrid from "../../../components/inventoryMap/CabinetGrid";
import CabinetDetailModal from "../../../components/inventoryMap/CabinetDetailModal";
import type {
  MapBatchItem,
  CabinetInfo,
  CabinetDrug,
  CabinetStatus,
} from "../../../types/inventoryMap";

// ── Constants ───────────────────────────────────────────────────────────────
const FLOORS  = [1, 2, 3];
const ROOMS   = ["A", "B", "C"];
const CABINETS = Array.from({ length: 10 }, (_, i) => `M${i + 1}`);

function makeCabinetKey(floor: number, room: string, cabinet: string) {
  return `F${floor}-${room}-${cabinet}`;
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function getCabinetStatus(expiry: string): CabinetStatus {
  const now      = new Date();
  now.setHours(0, 0, 0, 0);
  const exp      = new Date(expiry);
  exp.setHours(0, 0, 0, 0);
  const diffMs   = exp.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0)   return "expired";
  if (diffDays <= 30) return "near";
  return "safe";
}

/** Worst status wins: expired > near > safe */
const STATUS_PRIORITY: Record<CabinetStatus, number> = {
  expired: 3, near: 2, safe: 1, empty: 0,
};

function worstStatus(statuses: CabinetStatus[]): CabinetStatus {
  if (statuses.length === 0) return "empty";
  return statuses.reduce((a, b) =>
    STATUS_PRIORITY[b] > STATUS_PRIORITY[a] ? b : a
  );
}

// ── Build cabinet map from flat batch list ────────────────────────────────────
function buildCabinetMap(
  batches: MapBatchItem[],
  floor: number
): Map<string, CabinetInfo> {
  // Pre-fill all cabinets for the floor as empty
  const map = new Map<string, CabinetInfo>();
  for (const room of ROOMS) {
    for (const cab of CABINETS) {
      const key = makeCabinetKey(floor, room, cab);
      map.set(key, {
        key, label: cab, floor, room,
        status: "empty", isFull: false,
        drugs: [], totalQuantity: 0,
      });
    }
  }

  // Fill with real batch data
  for (const b of batches) {
    if (!b.position) continue;
    // position format: "F1-A-M3"
    const parts = b.position.split("-");
    if (parts.length < 3) continue;
    const bFloor = parseInt(parts[0].replace("F", ""), 10);
    if (bFloor !== floor) continue;

    const info = map.get(b.position);
    if (!info) continue;

    const drugStatus = getCabinetStatus(b.expiry_date);
    const drug: CabinetDrug = {
      batchId:      b.id,
      batchCode:    b.batch_code,
      medicineName: b.medicine_name,
      medicineId:   b.medicine_id,
      quantity:     b.quantity,
      expiryDate:   b.expiry_date,
      status:       drugStatus,
    };

    info.drugs.push(drug);
    info.totalQuantity += b.quantity;
    if (b.cabinet_is_full) info.isFull = true;
  }

  // Compute final cabinet status
  for (const info of map.values()) {
    if (info.drugs.length === 0) {
      info.status = "empty";
    } else {
      info.status = worstStatus(info.drugs.map((d) => d.status));
    }
  }

  return map;
}

// ── Stats helper ──────────────────────────────────────────────────────────────
function computeStats(cabinets: CabinetInfo[]) {
  const total   = cabinets.length;
  const empty   = cabinets.filter((c) => c.status === "empty").length;
  const expired = cabinets.filter((c) => c.status === "expired").length;
  const near    = cabinets.filter((c) => c.status === "near").length;
  const safe    = cabinets.filter((c) => c.status === "safe").length;
  const full    = cabinets.filter((c) => c.isFull).length;
  const used    = total - empty;
  return { total, empty, expired, near, safe, full, used, utilization: ((used / total) * 100).toFixed(1) };
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WarehouseMapPage() {
  const userRole = useAppSelector((s) => s.auth.user?.role ?? "");

  const [activeFloor, setActiveFloor] = useState(1);
  const [batches,     setBatches]     = useState<MapBatchItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Fetch all map data once
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventoryMap();
      setBatches(data);
    } catch {
      setError("Không thể tải dữ liệu sơ đồ kho. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build cabinet map for active floor
  const cabinetMap = buildCabinetMap(batches, activeFloor);

  // Grouped by room for the active floor
  const cabinetsByRoom = ROOMS.reduce<Record<string, CabinetInfo[]>>((acc, room) => {
    acc[room] = CABINETS.map((cab) => {
      const key = makeCabinetKey(activeFloor, room, cab);
      return cabinetMap.get(key)!;
    });
    return acc;
  }, {});

  const allCabinets = Array.from(cabinetMap.values());
  const stats = computeStats(allCabinets);
  const selectedCabinet = selectedKey ? cabinetMap.get(selectedKey) ?? null : null;

  // Toggle full status optimistically
  const handleToggleFull = async (key: string, isFull: boolean) => {
    // Optimistic update
    setBatches((prev) =>
      prev.map((b) =>
        b.position === key ? { ...b, cabinet_is_full: isFull } : b
      )
    );
    try {
      await setCabinetFull(key, isFull);
    } catch {
      // Revert on error
      setBatches((prev) =>
        prev.map((b) =>
          b.position === key ? { ...b, cabinet_is_full: !isFull } : b
        )
      );
    }
  };

  return (
    <div className="page animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", gap: 20 }}>
      <PageHeader
        title="Sơ đồ Kho Dược"
        subtitle="Quản lý vị trí, trạng thái tủ thuốc theo phòng và tầng"
      />

      {/* ── KPI strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        {[
          { label: "Tổng tủ",      value: stats.total,       color: "var(--primary)" },
          { label: "Đang dùng",    value: stats.used,        color: "#059669" },
          { label: "Cận date",     value: stats.near,        color: "#F59E0B" },
          { label: "Hết hạn",      value: stats.expired,     color: "#EF4444" },
          { label: "Trống",        value: stats.empty,       color: "var(--on-surface-variant)" },
          { label: "Đánh dấu đầy", value: stats.full,        color: "#7C3AED" },
        ].map((kpi) => (
          <div key={kpi.label} className="metric-card" style={{ padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--on-surface-variant)", fontWeight: 600, marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "var(--on-surface-variant)" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
            <div style={{ fontWeight: 600 }}>Đang tải sơ đồ kho...</div>
          </div>
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "#EF4444" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 600 }}>{error}</div>
            <button
              onClick={fetchData}
              style={{
                marginTop: 16, padding: "8px 20px", borderRadius: 10,
                background: "var(--primary)", color: "#fff",
                border: "none", cursor: "pointer", fontWeight: 600,
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <div className="metric-card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Floor tabs + Legend */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20, paddingBottom: 16,
            borderBottom: "1px solid var(--outline-variant)",
          }}>
            <div className="tab-group">
              {FLOORS.map((f) => (
                <button
                  key={f}
                  className={`tab${activeFloor === f ? " active" : ""}`}
                  onClick={() => { setActiveFloor(f); setSelectedKey(null); }}
                >
                  Tầng {f}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, fontSize: "0.73rem", fontWeight: 600, color: "var(--on-surface-variant)", flexWrap: "wrap" }}>
              {[
                { color: "var(--surface-container-high)", dashed: true, label: "Trống" },
                { color: "#059669",  label: "Còn hạn" },
                { color: "#F59E0B",  label: "Cận date" },
                { color: "#EF4444",  label: "Hết hạn" },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: 3,
                    background: l.color,
                    border: l.dashed ? "1.5px dashed var(--outline)" : "none",
                    flexShrink: 0,
                  }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Utilisation bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--on-surface-variant)", marginBottom: 6 }}>
              <span>Hiệu suất sử dụng tầng {activeFloor}</span>
              <span style={{ fontWeight: 700 }}>{stats.utilization}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${stats.utilization}%`, background: "#059669" }} />
            </div>
          </div>

          {/* Room grids */}
          <div style={{ display: "flex", gap: 16, flex: 1 }}>
            {ROOMS.map((room) => (
              <CabinetGrid
                key={room}
                room={room}
                cabinets={cabinetsByRoom[room]}
                selectedKey={selectedKey}
                onSelect={(key) => setSelectedKey(selectedKey === key ? null : key)}
              />
            ))}
          </div>

          {/* Empty state if no batches assigned to this floor */}
          {allCabinets.every((c) => c.status === "empty") && (
            <div style={{ marginTop: 16 }}>
              <EmptyState icon="inventory_2" message="Chưa có thuốc nào được gán vị trí ở tầng này" />
            </div>
          )}
        </div>
      )}

      {/* ── Cabinet Detail Modal ── */}
      {selectedCabinet && (
        <CabinetDetailModal
          cabinet={selectedCabinet}
          userRole={userRole}
          onClose={() => setSelectedKey(null)}
          onToggleFull={handleToggleFull}
        />
      )}
    </div>
  );
}
