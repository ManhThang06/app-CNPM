import { useMemo, useState, useEffect } from "react";
import { PageHeader, MetricCard, StatusPill, Icon, EmptyState } from "../../components/UI";
import { getImportRequests, receiveImportRequest, rejectImportRequest } from "../../api/medicineRequestApi";
import { getInventoryMap } from "../../api/inventoryMapApi";
import { WAREHOUSE_FLOORS, getWarehouseByFloor } from "../../constants/warehouse";

/* ─── Giữ nguyên types ─── */
type RequestSource = "manager" | "requestor";
type RequestType = "import" | "return";
type RequestItem = { productName: string; quantity: number };
type WarehouseRequest = {
  id: number;
  createdAt: string;
  status: "pending" | "processed" | "rejected" | "PENDING" | "RECEIVED" | "REJECTED";
  source: RequestSource;
  type: RequestType;
  items: RequestItem[];
  medicine_name?: string;
  quantity?: number;
  note?: string;
  batch_code?: string;
  expiry_date?: string;
};

export default function ImportRequestPage() {
  /* ─── State ─── */
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WarehouseRequest | null>(null);
  const [status, setStatus] = useState<"full" | "partial" | "excess">("full");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState("");
  const [floor, setFloor] = useState<number>(1);
  const [room, setRoom] = useState<string>("A");
  const [cabinet, setCabinet] = useState<string>("M1");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [fullPositions, setFullPositions] = useState<string[]>([]);

  // Load import requests từ API
  useEffect(() => {
    getImportRequests()
      .then((res) => {
        // Map API response sang WarehouseRequest layout
        const data = res.data.map((r: any) => ({
          id: r.id,
          createdAt: r.received_date
            ? new Date(r.received_date).toLocaleDateString("vi-VN")
            : new Date(r.created_at || Date.now()).toLocaleDateString("vi-VN"),
          status:
            r.status === "RECEIVED" ? "processed" : (r.status === "REJECTED" ? "rejected" : "pending"),
          source: r.created_by ? "manager" : "requestor",
          type: "import" as RequestType,
          medicine_name: r.medicine_name,
          quantity: r.quantity,
          note: r.note,
          batch_code: r.batch_code,
          expiry_date: r.expiry_date ? new Date(r.expiry_date).toISOString().split("T")[0] : "",
          items: [{ productName: r.medicine_name || "—", quantity: r.quantity }],
        }));
        setRequests(data);
      })
      .catch((err) => alert(err.response?.data?.message || "Lỗi tải danh sách nhập kho"))
      .finally(() => setLoading(false));
  }, []);

  // Load full positions
  useEffect(() => {
    getInventoryMap()
      .then((data) => {
        const full = data.filter((b) => b.cabinet_is_full).map((b) => b.position);
        setFullPositions([...new Set(full as string[])]);
      })
      .catch(() => {});
  }, []);

  const getTotal = (items: RequestItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    processed: requests.filter((r) => r.status === "processed").length,
  }), [requests]);
  const selectedPosition = `F${floor}-${room}-${cabinet}`;

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectNote.trim()) {
      alert("Vui lòng nhập ghi chú từ chối!");
      return;
    }
    try {
      await rejectImportRequest(selected.id, rejectNote);
      setRequests((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, status: "rejected" } : r))
      );
      setSelected(null);
      setShowRejectModal(false);
      setRejectNote("");
      alert("Đã từ chối lô hàng!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi từ chối");
    }
  };

  const [positions, setPositions] = useState<{ position: string; quantity: number }[]>([]);
  
  const handleAddPosition = () => {
    const posKey = `F${floor}-${room}-${cabinet}`;
    if (fullPositions.includes(posKey)) {
      alert("Vị trí này đã được đánh dấu là đầy! Vui lòng chọn vị trí khác.");
      return;
    }
    if (positions.find(p => p.position === posKey)) {
      alert("Vị trí này đã được chọn!");
      return;
    }
    setPositions([...positions, { position: posKey, quantity: 0 }]);
  };

  const handleRemovePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const handlePositionQuantityChange = (index: number, qty: number) => {
    const newPositions = [...positions];
    newPositions[index].quantity = qty;
    setPositions(newPositions);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (!expiryDate) {
      alert("Vui lòng nhập hạn sử dụng.");
      return;
    }
    if (positions.length === 0) {
      alert("Vui lòng chọn ít nhất một vị trí lưu trữ.");
      return;
    }

    const totalAllocated = positions.reduce((sum, p) => sum + p.quantity, 0);
    if (totalAllocated !== quantity) {
      alert(`Tổng số lượng ở các tủ (${totalAllocated}) phải bằng số lượng thực nhận (${quantity}).`);
      return;
    }

    try {
      const res = await receiveImportRequest(selected.id, {
        batch_code: selected.batch_code,
        quantity: quantity,
        expiry_date: expiryDate,
        status,
        note,
        positions: positions,
      });
      const batchCode = res.data?.batchCode || selected.batch_code;
      // Cập nhật UI local
      setRequests((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, status: "processed", batch_code: batchCode } : r))
      );
      setSelected(null);
      setStatus("full");
      setNote("");
      setQuantity(0);
      setExpiryDate("");
      setPositions([]);
      alert("Xác nhận nhận hàng thành công!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xác nhận nhận hàng");
    }
  };

  if (loading) return <div className="page"><p style={{ color: "var(--on-surface-variant)" }}>Đang tải...</p></div>;

  return (
    <div className="page animate-fade-in">
      <PageHeader title="Thông báo nhập kho" subtitle="Quản lý request nhập / hoàn trả từ quản lý & người dùng" />

      {/* ─── Stats ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
        <MetricCard label="Tổng yêu cầu" value={stats.total} icon="inbox" color="var(--primary)" />
        <MetricCard label="Chờ xử lý" value={stats.pending} icon="pending" color="#F59E0B" borderColor={stats.pending > 0 ? "#F59E0B" : undefined} />
        <MetricCard label="Đã xử lý" value={stats.processed} icon="check_circle" color="#4CA1AF" />
      </div>

      {/* ─── Table ─── */}
      <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="wms-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Ngày</th>
              <th>Tên thuốc</th>
              <th>Mã lô</th>
              <th>Tổng SL</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon="inbox" message="Chưa có yêu cầu nào" /></td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>#{r.id}</td>
                  <td>{r.createdAt}</td>
                  <td style={{ fontWeight: 600 }}>{r.medicine_name || "—"}</td>
                  <td>{r.batch_code || "Tự động"}</td>
                  <td style={{ fontWeight: 600 }}>{r.quantity}</td>
                  <td>
                    <StatusPill 
                      status={r.status} 
                      label={r.status === "pending" ? "Chờ xử lý" : (r.status === "processed" ? "Đã nhập" : "Đã từ chối")} 
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      disabled={r.status !== "pending"}
                      onClick={() => { setSelected(r); setQuantity(r.quantity || 0); setExpiryDate(r.expiry_date || ""); }}
                    >
                      <Icon name="check_circle" size={14} /> Xử lý
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Modal ─── */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal-box wms-form">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 className="font-headline" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Xử lý #{selected.id}</h2>
                <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginTop: 2 }}>
                  {selected.source === "manager" ? "QL kho" : "Người dùng"} · Nhập kho · {selected.createdAt}
                </p>
              </div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setSelected(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Thuốc", value: selected.medicine_name || selected.items[0]?.productName },
                { label: "Mã lô", value: selected.batch_code || "Tự động tạo" },
                { label: "HSD", value: expiryDate ? new Date(expiryDate).toLocaleDateString("vi-VN") : "Chưa nhập" },
                { label: "Số lượng YC", value: getTotal(selected.items) },
                { label: "Ghi chú", value: selected.note || "—" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--surface-container-low)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--on-surface-variant)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 700, color: "var(--on-surface)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Thông tin lô hàng nhận */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Số lượng thực nhận</label>
                  <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Hạn sử dụng</label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Vị trí lưu trữ</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={floor} onChange={(e) => setFloor(Number(e.target.value))} style={{ flex: 1 }}>
                      {WAREHOUSE_FLOORS.map((warehouse) => (
                        <option key={warehouse.floor} value={warehouse.floor}>
                          {warehouse.description}
                        </option>
                      ))}
                    </select>
                    <select value={room} onChange={(e) => setRoom(e.target.value)} style={{ flex: 1 }}>
                      <option value="A">Phòng A</option>
                      <option value="B">Phòng B</option>
                      <option value="C">Phòng C</option>
                    </select>
                    <select value={cabinet} onChange={(e) => setCabinet(e.target.value)} style={{ flex: 1 }}>
                      {Array.from({ length: 10 }, (_, i) => {
                        const cabKey = `M${i + 1}`;
                        const posKey = `F${floor}-${room}-${cabKey}`;
                        const isFull = fullPositions.includes(posKey);
                        return (
                          <option key={cabKey} value={cabKey} disabled={isFull}>
                            Tủ {cabKey} {isFull ? "(Đầy)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <button className="btn btn-secondary" onClick={handleAddPosition} type="button">
                      <Icon name="add" size={16} /> Thêm tủ
                    </button>
                  </div>
                  
                  {/* Selected positions list */}
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {positions.map((p, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface-container-high)", padding: "8px 12px", borderRadius: 8 }}>
                        <span style={{ fontWeight: 700, flex: 1 }}>{p.position}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <label className="text-label-sm">SL:</label>
                          <input 
                            type="number" 
                            min={1} 
                            style={{ width: 80, padding: "4px 8px" }} 
                            value={p.quantity} 
                            onChange={(e) => handlePositionQuantityChange(idx, Number(e.target.value))} 
                          />
                        </div>
                        <button className="btn btn-ghost" style={{ color: "var(--error)", padding: 4 }} onClick={() => handleRemovePosition(idx)}>
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Status radio */}
            <div style={{ marginBottom: 12 }}>
              <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>Tình trạng nhận hàng</div>
              <div style={{ display: "flex", gap: 16 }}>
                {(["full", "partial", "excess"] as const).map((val) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem" }}>
                    <input type="radio" checked={status === val} onChange={() => setStatus(val)} />
                    {val === "full" ? "Đủ hàng" : val === "partial" ? "Thiếu hàng" : "Dư số lượng"}
                  </label>
                ))}
              </div>
            </div>

            {(status === "partial" || status === "excess") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
                <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Ghi chú {status === "partial" ? "thiếu" : "dư"} hàng</label>
                <textarea rows={3} placeholder={status === "partial" ? "Mô tả tình trạng thiếu hàng..." : "Mô tả tình trạng dư hàng..."} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn btn-secondary" style={{ color: "var(--error)", border: "1px solid var(--error)" }} onClick={() => setShowRejectModal(true)}>
                <Icon name="block" size={16} /> Từ chối nhập lô
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Huỷ</button>
                <button id="btn-confirm-import" className="btn btn-primary" onClick={handleSubmit}>
                  <Icon name="check_circle" size={16} /> Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ─── */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div className="metric-card animate-fade-in" style={{ width: "min(400px, 100%)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--error)" }}>Từ chối lô hàng</h2>
            <textarea
              placeholder="Nhập lý do từ chối (bắt buộc)..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              style={{ width: "100%", height: 100, padding: 12, borderRadius: 8, border: "1px solid var(--outline-variant)", resize: "none" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>Hủy</button>
              <button className="btn btn-primary" style={{ background: "var(--error)", border: "none" }} onClick={handleReject}>Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
