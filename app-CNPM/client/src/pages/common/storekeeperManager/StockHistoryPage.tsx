import { useMemo, useState, useEffect } from "react";
import { PageHeader, StatusPill, Icon, EmptyState } from "../../../components/UI";
import { getInventoryLogs } from "../../../api/medicineRequestApi";

/* ─── Giữ nguyên types ─── */
type HistoryItem = {
  id: number;
  requestCode: string;
  type: "IMPORT" | "EXPORT" | "ADJUST";
  date: string;
  status: "approved" | "pending" | "rejected" | "shortage" | "excess";
  items: { product: string; quantity: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Hoàn tất",
  pending: "Đang chờ",
  rejected: "Từ chối",
  shortage: "Thiếu thuốc",
  excess: "Dư số lượng",
};

export default function StockHistoryPage() {
  /* ─── State ─── */
  const [tab, setTab] = useState<"IMPORT" | "EXPORT">("IMPORT");
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch logs theo tab
  useEffect(() => {
    setLoading(true);
    getInventoryLogs(tab)
      .then((res) => {
        const mapped: HistoryItem[] = res.data.map((log: any) => ({
          id: log.id,
          requestCode: `LOG-${String(log.id).padStart(3, "0")}`,
          type: log.type as "IMPORT" | "EXPORT" | "ADJUST",
          date: log.created_at
            ? new Date(log.created_at).toLocaleDateString("vi-VN")
            : "—",
          // Tự động nhận diện trạng thái từ lý do/ghi chú
          status: log.note?.toLowerCase().includes("từ chối") ? "rejected"
                : log.note?.toLowerCase().includes("thiếu") ? "shortage"
                : log.note?.toLowerCase().includes("dư") ? "excess"
                : "approved",
          items: [
            {
              product: log.medicine_name || `Thuốc #${log.medicine_id}`,
              quantity: Math.abs(Number(log.change_amount)),
            },
          ],
        }));
        setHistory(mapped);
      })
      .catch((err) => alert(err.response?.data?.message || "Lỗi tải lịch sử kho"))
      .finally(() => setLoading(false));
  }, [tab]);

  const data = useMemo(() => history, [history]);

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Lịch sử kho"
        subtitle="Theo dõi lịch sử xuất / nhập kho"
      />

      {/* ─── Tabs ─── */}
      <div className="tab-group" style={{ alignSelf: "flex-start", display: "inline-flex", marginBottom: 20 }}>
        <button id="tab-import" className={`tab${tab === "IMPORT" ? " active" : ""}`} onClick={() => setTab("IMPORT")}>
          <Icon name="input" size={16} /> Nhập kho
        </button>
        <button id="tab-export" className={`tab${tab === "EXPORT" ? " active" : ""}`} onClick={() => setTab("EXPORT")}>
          <Icon name="output" size={16} /> Xuất kho
        </button>
      </div>

      {/* ─── Table ─── */}
      <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--on-surface-variant)" }}>
            Đang tải lịch sử...
          </div>
        ) : (
          <table className="wms-table">
            <thead>
              <tr>
                <th>Mã log</th>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon="history" message="Không có lịch sử" />
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.requestCode}</td>
                    <td>{item.date}</td>
                    <td>
                      <StatusPill status={item.type} label={item.type === "IMPORT" ? "Nhập kho" : "Xuất kho"} />
                    </td>
                    <td>
                      <StatusPill status={item.status} label={STATUS_LABEL[item.status]} />
                    </td>
                    <td>
                      <button
                        id={`detail-${item.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        onClick={() => setSelected(item)}
                      >
                        <Icon name="visibility" size={14} /> Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Detail modal ─── */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal-box-sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 className="font-headline" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  Chi tiết {selected.requestCode}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", marginTop: 2 }}>
                  {selected.type === "IMPORT" ? "Nhập kho" : "Xuất kho"} · {selected.date}
                </p>
              </div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setSelected(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <div
              style={{
                border: "1px solid var(--outline-variant)",
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <div style={{ background: "var(--surface-container-low)", padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr auto" }}>
                <span className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Sản phẩm</span>
                <span className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Số lượng</span>
              </div>
              {selected.items.map((i, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    padding: "12px 16px",
                    borderTop: "1px solid var(--outline-variant)",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>{i.product}</span>
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>×{i.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <StatusPill status={selected.status} label={STATUS_LABEL[selected.status]} />
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
