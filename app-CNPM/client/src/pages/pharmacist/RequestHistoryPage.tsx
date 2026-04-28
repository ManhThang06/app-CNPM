import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyExportRequests } from "../../api/medicineRequestApi";
import { PageHeader, StatusPill, Icon, EmptyState } from "../../components/UI";

type RequestItem = {
  productId: number;
  productName: string;
  quantity: number;
  exportedQuantity?: number;
};

type StockRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "failed"
  | "shortage"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "FAILED"
  | "SHORTAGE";

type StockRequest = {
  id: number;
  type: "take" | "return";
  items: RequestItem[];
  status: StockRequestStatus;
  createdAt: string;
  processedAt?: string;
  note?: string;
};

/* ─── Giữ nguyên types ─── */
type FilterStatus = "ALL" | StockRequest["status"];
type FilterType = "ALL" | "take" | "return";

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  PENDING: "Chờ xử lý",
  approved: "Đã duyệt",
  APPROVED: "Đã duyệt",
  rejected: "Từ chối",
  REJECTED: "Từ chối",
  completed: "Hoàn thành",
  COMPLETED: "Hoàn thành",
  failed: "Thất bại",
  FAILED: "Thất bại",
  shortage: "Thiếu thuốc",
  SHORTAGE: "Thiếu thuốc",
};

export default function MedicineHistoryPage() {
  const navigate = useNavigate();

  /* ─── Giữ nguyên state & filter logic ─── */
  const [selected, setSelected] = useState<StockRequest | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyExportRequests()
      .then((res) => {
        // Map API response sang StockRequest format
        const mapped: StockRequest[] = res.data.map((r: any) => ({
          id: r.id,
          type: "take" as const,
          status: (r.status?.toLowerCase() ?? "pending") as StockRequestStatus,
          createdAt: r.created_at
            ? new Date(r.created_at).toISOString().split("T")[0]
            : "",
          processedAt: r.processed_date
            ? new Date(r.processed_date).toISOString().split("T")[0]
            : undefined,
          note: r.feedback_note,
          items: (r.items || []).map((i: any) => ({
            productId: i.medicine_id,
            productName: i.medicine_name || `Thuốc #${i.medicine_id}`,
            quantity: i.quantity,
            exportedQuantity: Number(i.exported_quantity) || 0,
          })),
        }));
        setRequests(mapped);
      })
      .catch((err) => alert(err.response?.data?.message || "Lỗi tải lịch sử yêu cầu"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchType = filterType === "ALL" || r.type === filterType;
      const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
      const matchDate = !filterDate || r.createdAt === filterDate;
      return matchType && matchStatus && matchDate;
    });
  }, [requests, filterType, filterStatus, filterDate]);

  if (loading) return <div className="page"><p style={{ color: "var(--on-surface-variant)" }}>Đang tải...</p></div>;

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Yêu cầu lấy thuốc"
        subtitle="Lịch sử yêu cầu và tạo yêu cầu mới"
        actions={
          <button
            id="btn-create-request"
            className="btn btn-primary"
            onClick={() => navigate("/medicine-request/create")}
          >
            <Icon name="add" size={16} /> Tạo yêu cầu
          </button>
        }
      />

      {/* ─── Filter bar ─── */}
      <div className="filter-bar">
        <select
          className="wms-input"
          style={{ width: 180 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
          <option value="completed">Hoàn thành</option>
          <option value="shortage">Thiếu thuốc</option>
        </select>

        <select
          className="wms-input"
          style={{ width: 160 }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
        >
          <option value="ALL">Tất cả loại</option>
          <option value="take">Lấy thuốc</option>
          <option value="return">Trả thuốc</option>
        </select>

        <input
          className="wms-input"
          type="date"
          style={{ width: 180 }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <button
          className="btn btn-ghost"
          onClick={() => { setFilterType("ALL"); setFilterStatus("ALL"); setFilterDate(""); }}
        >
          <Icon name="refresh" size={16} /> Reset
        </button>

        <div style={{ marginLeft: "auto", fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>
          <strong>{filtered.length}</strong> kết quả
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="wms-table">
          <thead>
            <tr>
              <th>Mã yêu cầu</th>
              <th>Loại</th>
              <th>Số loại thuốc</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: "right" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon="history_edu" message="Không có yêu cầu nào" />
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>#{r.id}</td>
                  <td>
                    <StatusPill
                      status={r.type === "take" ? "active" : "EXPORT"}
                      label={r.type === "take" ? "Lấy thuốc" : "Trả thuốc"}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.items.length}</td>
                  <td>
                    <StatusPill status={r.status} label={STATUS_LABEL[r.status] ?? r.status} />
                  </td>
                  <td style={{ color: "var(--on-surface-variant)" }}>{r.createdAt}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      onClick={() => setSelected(r)}
                    >
                      <Icon name="visibility" size={14} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Detail modal ─── */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal-box-sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 className="font-headline" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  Yêu cầu #{selected.id}
                </h2>
                <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginTop: 2 }}>
                  {selected.type === "take" ? "Lấy thuốc" : "Trả thuốc"} · {selected.createdAt}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusPill status={selected.status} label={STATUS_LABEL[selected.status] ?? selected.status} />
                <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setSelected(null)}>
                  <Icon name="close" size={20} />
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid var(--outline-variant)", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ background: "var(--surface-container-low)", padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr auto" }}>
                <span className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Tên thuốc</span>
                <span className="text-label-sm" style={{ color: "var(--on-surface-variant)", textAlign: "right" }}>Yêu cầu / Thực nhận</span>
              </div>
              {selected.items.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--on-surface-variant)", fontSize: "0.875rem" }}>
                  Không có dữ liệu
                </div>
              ) : (
                selected.items.map((i) => (
                  <div
                    key={i.productId}
                    style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "12px 16px", borderTop: "1px solid var(--outline-variant)", fontSize: "0.875rem" }}
                  >
                    <span>{i.productName}</span>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: "var(--on-surface-variant)" }}>Y/c: <strong style={{ color: "var(--on-surface)" }}>{i.quantity}</strong></span>
                      {(selected.status === 'completed' || selected.status === 'COMPLETED' || selected.status === 'shortage' || selected.status === 'SHORTAGE') ? (
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontWeight: 700, color: (i.exportedQuantity ?? 0) < i.quantity ? "var(--warning)" : "var(--primary)" }}>
                            Thực nhận: {i.exportedQuantity}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selected.note && (
              <div style={{ background: "var(--error-container)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.875rem", color: "var(--on-error-container)" }}>
                <strong>Ghi chú:</strong> {selected.note}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
