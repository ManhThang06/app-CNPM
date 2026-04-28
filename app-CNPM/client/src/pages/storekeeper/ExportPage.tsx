import { useMemo, useState, useEffect } from "react";
import { PageHeader, Icon, StatusPill, EmptyState } from "../../components/UI";
import {
  getPendingExportRequests,
  getBatchesByMedicine,
  completeExportRequest,
  rejectExportRequest,
} from "../../api/medicineRequestApi";

/* ─── Giữ nguyên types ─── */
type RequestItem = { medicine_id: number; medicine_name: string; quantity: number };
type StockRequest = { id: number; status: "pending" | "approved" | "rejected" | "completed" | "shortage" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "SHORTAGE"; items: RequestItem[] };
type Batch = { id: number; medicine_id: number; batch_code: string; quantity: number; expiry_date: string };
type ExportItem = { batchId: number; batchCode: string; quantity: number; productId: number };

export default function ExportPage() {
  /* ─── State ─── */
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [exportItems, setExportItems] = useState<ExportItem[]>([]);

  // States cho Shortage Modal
  const [showShortageModal, setShowShortageModal] = useState(false);
  const [shortageData, setShortageData] = useState<{
    exportedItems: {batchCode: string, quantity: number}[];
    shortageInfo: {medicineName: string, shortageAmount: number}[];
  } | null>(null);

  // Fetch danh sách yêu cầu pending
  useEffect(() => {
    getPendingExportRequests()
      .then((res) => {
        let data: StockRequest[] = res.data;
        data = data.filter(r => !['COMPLETED', 'REJECTED', 'SHORTAGE', 'completed', 'rejected', 'shortage'].includes(r.status));
        setStockRequests(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          setSelectedProductId(data[0].items?.[0]?.medicine_id ?? null);
        }
      })
      .catch((err) => alert(err.response?.data?.message || "Lỗi tải danh sách yêu cầu"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch batches theo medicine khi selectedProductId thay đổi
  useEffect(() => {
    if (!selectedProductId) { setBatches([]); return; }
    getBatchesByMedicine(selectedProductId)
      .then((res) => setBatches(res.data))
      .catch(() => setBatches([]));
  }, [selectedProductId]);

  const request = useMemo(() => stockRequests.find((r) => r.id === selectedId), [selectedId, stockRequests]);

  const relatedBatches = useMemo(() => {
    if (!selectedProductId) return [];
    return batches
      .filter((b) => b.medicine_id === selectedProductId && b.quantity > 0)
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  }, [selectedProductId, batches]);

  const totalExport = exportItems.reduce((s, i) => s + i.quantity, 0);

  const missingItems = useMemo(() => {
    if (!request) return [];
    return request.items.map(reqItem => {
      const selected = exportItems.filter(i => i.productId === reqItem.medicine_id).reduce((s, i) => s + i.quantity, 0);
      return {
        name: reqItem.medicine_name,
        requested: reqItem.quantity,
        selected,
        missing: reqItem.quantity - selected
      };
    }).filter(i => i.missing > 0);
  }, [request, exportItems]);

  const handleAdd = (b: Batch) => {
    const maxReq = request?.items.find(i => i.medicine_id === b.medicine_id)?.quantity || 0;
    const currentSelected = exportItems.filter(i => i.productId === b.medicine_id).reduce((s, i) => s + i.quantity, 0);
    
    if (currentSelected >= maxReq) {
      alert("Đã đạt số lượng yêu cầu của thuốc này!");
      return;
    }
    
    const remainingNeeded = maxReq - currentSelected;
    
    setExportItems((prev) => {
      const existed = prev.find((i) => i.batchId === b.id);
      if (existed) {
        const roomInBatch = b.quantity - existed.quantity;
        if (roomInBatch <= 0) return prev;
        const addAmount = Math.min(remainingNeeded, roomInBatch);
        return prev.map((i) => i.batchId === b.id ? { ...i, quantity: i.quantity + addAmount } : i);
      }
      const initialAdd = Math.min(remainingNeeded, b.quantity);
      return [...prev, { batchId: b.id, batchCode: b.batch_code, quantity: initialAdd, productId: b.medicine_id }];
    });
  };

  const handleIncrease = (batchId: number) => {
    const exportItem = exportItems.find(i => i.batchId === batchId);
    if (!exportItem) return;
    const b = batches.find(b => b.id === batchId);
    if (!b) return;

    const maxReq = request?.items.find(i => i.medicine_id === b.medicine_id)?.quantity || 0;
    const currentSelected = exportItems.filter(i => i.productId === b.medicine_id).reduce((s, i) => s + i.quantity, 0);
    
    if (currentSelected >= maxReq || exportItem.quantity >= b.quantity) return;

    setExportItems((prev) => prev.map((i) => i.batchId === batchId ? { ...i, quantity: i.quantity + 1 } : i));
  };

  const canIncrease = (batchId: number) => {
    const exportItem = exportItems.find(i => i.batchId === batchId);
    if (!exportItem) return false;
    const b = batches.find(b => b.id === batchId);
    if (!b) return false;

    const maxReq = request?.items.find(i => i.medicine_id === b.medicine_id)?.quantity || 0;
    const currentSelected = exportItems.filter(i => i.productId === b.medicine_id).reduce((s, i) => s + i.quantity, 0);
    
    return exportItem.quantity < b.quantity && currentSelected < maxReq;
  };

  const handleDecrease = (id: number) => setExportItems((prev) => prev.map((i) => i.batchId === id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0));
  const handleRemove = (id: number) => setExportItems((prev) => prev.filter((i) => i.batchId !== id));

  // States for Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      alert("Vui lòng nhập ghi chú từ chối!");
      return;
    }
    try {
      await rejectExportRequest(selectedId, rejectNote);
      alert("Đã từ chối yêu cầu!");
      setShowRejectModal(false);
      setRejectNote("");
      // Refresh
      const res = await getPendingExportRequests();
      let data: StockRequest[] = res.data;
      data = data.filter(r => !['COMPLETED', 'REJECTED', 'SHORTAGE', 'completed', 'rejected', 'shortage'].includes(r.status));
      setStockRequests(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
        setSelectedProductId(data[0].items?.[0]?.medicine_id ?? null);
      } else {
        setSelectedId(0);
        setSelectedProductId(null);
      }
      setExportItems([]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi từ chối");
    }
  };

  const handleSubmit = async () => {
    if (!exportItems.length) return;
    try {
      const response = await completeExportRequest(
        selectedId,
        exportItems.map((i) => ({ batch_id: i.batchId, quantity: i.quantity }))
      );
      
      const resData = response.data;
      if (resData.hasShortage) {
        setShortageData({
          exportedItems: resData.exportedItems || [],
          shortageInfo: resData.shortageInfo || []
        });
        setShowShortageModal(true);
      } else {
        alert("Xuất kho thành công!");
      }
      
      setExportItems([]);
      // Refresh danh sách
      const res = await getPendingExportRequests();
      let data: StockRequest[] = res.data;
      data = data.filter(r => !['COMPLETED', 'REJECTED', 'SHORTAGE', 'completed', 'rejected', 'shortage'].includes(r.status));
      setStockRequests(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
        setSelectedProductId(data[0].items?.[0]?.medicine_id ?? null);
      } else {
        setSelectedId(0);
        setSelectedProductId(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xuất kho");
    }
  };

  if (loading) return <div className="page"><p style={{ color: "var(--on-surface-variant)" }}>Đang tải...</p></div>;

  return (
    <div className="page animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PageHeader title="Yêu cầu xuất kho" subtitle="Chọn lô thuốc để thực hiện xuất kho theo FEFO" />

      <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0, flexWrap: "wrap" }}>
        {/* ─── Left: Request list ─── */}
        <div style={{ width: "min(260px, 100%)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", padding: "0 4px" }}>Yêu cầu chờ xử lý</div>
          {stockRequests.length === 0 ? (
            <EmptyState icon="inbox" message="Không có yêu cầu nào" />
          ) : (
            stockRequests.map((r) => (
              <div
                key={r.id}
                onClick={() => { setSelectedId(r.id); setSelectedProductId(r.items[0]?.medicine_id ?? null); setExportItems([]); }}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  border: `1px solid ${selectedId === r.id ? "var(--primary-container)" : "var(--outline-variant)"}`,
                  background: selectedId === r.id ? "rgba(30,64,175,0.06)" : "var(--surface-container-lowest)",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: selectedId === r.id ? "var(--primary)" : "var(--on-surface)" }}>
                    Request #{r.id}
                  </span>
                  <StatusPill 
                    status={r.status.toLowerCase()} 
                    label={
                      (r.status === "pending" || r.status === "PENDING") ? "Chờ" : 
                      (r.status === "SHORTAGE" || r.status === "shortage") ? "Thiếu thuốc" : 
                      (r.status === "REJECTED" || r.status === "rejected") ? "Thất bại" : 
                      r.status
                    } 
                  />
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)" }}>
                  {r.items.length} loại thuốc · {r.items.reduce((s, i) => s + i.quantity, 0)} đơn vị
                </p>
              </div>
            ))
          )}
        </div>

        {/* ─── Right: Batch panel + Cart ─── */}
        <div style={{ flex: "1 1 620px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 20, minWidth: 0 }}>
          {/* Batch panel */}
          <div className="metric-card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Product tabs */}
            <div style={{ display: "flex", gap: 6, padding: "14px 16px", borderBottom: "1px solid var(--outline-variant)", overflowX: "auto" }}>
              {request?.items.map((item) => (
                <button
                  key={item.medicine_id}
                  onClick={() => setSelectedProductId(item.medicine_id)}
                  className={`btn ${selectedProductId === item.medicine_id ? "btn-primary" : "btn-secondary"}`}
                  style={{ flexShrink: 0, padding: "6px 14px", fontSize: "0.8rem" }}
                >
                  {item.medicine_name}
                </button>
              ))}
            </div>

            {/* FEFO label */}
            <div style={{ padding: "8px 16px", background: "rgba(30,64,175,0.04)", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="schedule" size={14} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600 }}>Sắp xếp FEFO (hạn gần nhất ưu tiên)</span>
            </div>

            {/* Batch list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {relatedBatches.length === 0 ? (
                <EmptyState icon="inventory_2" message="Không có lô khả dụng" />
              ) : (
                <table className="wms-table">
                  <thead>
                    <tr>
                      <th>Mã lô</th>
                      <th>Hạn sử dụng</th>
                      <th>Tồn kho</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedBatches.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.batch_code}</td>
                        <td style={{ color: new Date(b.expiry_date) < new Date() ? "var(--error)" : "var(--on-surface)" }}>
                          {new Date(b.expiry_date).toLocaleDateString("vi-VN")}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: "var(--primary)" }}>{b.quantity}</span>
                        </td>
                        <td>
                          <button className="btn btn-primary" style={{ padding: "4px 12px", fontSize: "0.8rem" }} onClick={() => handleAdd(b)}>
                            <Icon name="add" size={14} /> Thêm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="metric-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>Danh sách xuất</p>
                <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: 2 }}>
                  {exportItems.length} lô đã chọn
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {exportItems.length > 0 && (
                  <button className="btn btn-ghost" style={{ color: "var(--error)", fontSize: "0.78rem" }} onClick={() => setExportItems([])}>
                    <Icon name="clear_all" size={14} /> Xóa tất cả
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  style={{ color: "var(--error)", fontSize: "0.78rem", border: "1px solid var(--error)", padding: "6px 12px" }} 
                  onClick={() => setShowRejectModal(true)}
                  disabled={!request}
                >
                  <Icon name="block" size={14} /> Từ chối
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {exportItems.length === 0 ? (
                <EmptyState icon="shopping_cart" message="Chưa chọn lô nào" />
              ) : (
                exportItems.map((i) => (
                  <div key={i.batchId} style={{ padding: "12px 20px", borderBottom: "1px solid var(--outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{i.batchCode}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "1rem", lineHeight: 1 }} onClick={() => handleDecrease(i.batchId)}>−</button>
                      <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700 }}>{i.quantity}</span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "4px 10px", fontSize: "1rem", lineHeight: 1, opacity: canIncrease(i.batchId) ? 1 : 0.4 }} 
                        onClick={() => handleIncrease(i.batchId)}
                        disabled={!canIncrease(i.batchId)}
                      >
                        +
                      </button>
                    </div>
                    <button className="btn btn-ghost" style={{ color: "var(--error)", padding: "4px 8px" }} onClick={() => handleRemove(i.batchId)}>
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--outline-variant)", padding: "16px 20px" }}>
              {missingItems.length > 0 && exportItems.length > 0 && (
                <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(245,158,11,0.1)", borderRadius: 6, fontSize: "0.75rem", color: "#92400e" }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Còn thiếu:</div>
                  {missingItems.map((m, idx) => (
                    <div key={idx}>• {m.name}: thiếu {m.missing} (đã chọn {m.selected}/{m.requested})</div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>Tổng số lượng</span>
                <span className="font-headline" style={{ fontWeight: 800, fontSize: "1.25rem" }}>{totalExport}</span>
              </div>
              <button
                id="btn-confirm-export"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: 10 }}
                onClick={handleSubmit}
                disabled={exportItems.length === 0}
              >
                <Icon name="output" size={18} /> Xác nhận xuất kho
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Shortage Modal ─── */}
      {showShortageModal && shortageData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div className="metric-card animate-fade-in" style={{ width: "min(500px, 100%)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--warning)" }}>
              <Icon name="warning" size={28} />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--on-surface)" }}>Xuất kho hoàn tất (Có thiếu hàng)</h2>
            </div>
            
            <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>
              Hệ thống đã xuất tối đa số lượng có thể từ các lô được chọn. Tuy nhiên, một số thuốc không đủ số lượng yêu cầu.
            </p>

            {shortageData.shortageInfo.length > 0 && (
              <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 8, padding: 12 }}>
                <strong style={{ fontSize: "0.875rem", color: "#854d0e", display: "block", marginBottom: 8 }}>Chi tiết thiếu hàng:</strong>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.875rem", color: "#854d0e" }}>
                  {shortageData.shortageInfo.map((s, idx) => (
                    <li key={idx}><strong>{s.medicineName}</strong>: thiếu {s.shortageAmount} đơn vị</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <strong style={{ fontSize: "0.875rem", display: "block", marginBottom: 8 }}>Đã xuất thực tế:</strong>
              <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid var(--outline-variant)", borderRadius: 8 }}>
                <table className="wms-table">
                  <thead>
                    <tr>
                      <th>Mã lô</th>
                      <th style={{ textAlign: "right" }}>Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortageData.exportedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.batchCode}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{item.quantity}</td>
                      </tr>
                    ))}
                    {shortageData.exportedItems.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ textAlign: "center", color: "var(--on-surface-variant)" }}>Không xuất được lô nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowShortageModal(false)}
                style={{ padding: "8px 24px" }}
              >
                Đã hiểu, quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ─── */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div className="metric-card animate-fade-in" style={{ width: "min(400px, 100%)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--error)" }}>Từ chối yêu cầu xuất kho</h2>
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
