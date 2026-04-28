import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Icon } from "../../components/UI";
import { getAllBatches, createAudit } from "../../api/medicineRequestApi";
import { ROUTES } from "../../constants/routes";

type AuditItem = {
  id: number; // batch_id
  medicine_id: number;
  productName: string;
  batchName: string;
  systemQty: number;
  actualQty: number;
};

export default function CreateAuditSessionPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBatches()
      .then((res) => {
        const initialItems: AuditItem[] = res.data.map((b: any) => ({
          id: b.id,
          medicine_id: b.medicine_id,
          productName: b.medicine_name || `Thuốc #${b.medicine_id}`,
          batchName: b.batch_code,
          systemQty: b.quantity,
          actualQty: b.quantity, // Mặc định khớp
        }));
        setItems(initialItems);
      })
      .catch((err) => alert("Lỗi tải danh sách lô: " + err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChangeActual = (id: number, value: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, actualQty: value } : i)));
  };

  const handleConfirm = async () => {
    try {
      const payload = items.map((i) => ({
        medicine_id: i.medicine_id,
        batch_id: i.id,
        system_qty: i.systemQty,
        actual_qty: i.actualQty,
      }));
      await createAudit(payload, { confirm: true });
      alert("Đã tạo đợt kiểm kê!");
      navigate(ROUTES.INVENTORY);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi tạo kiểm kê");
    }
  };

  if (loading) return <div className="page"><p>Đang tải danh sách lô...</p></div>;

  const totalDiff = items.reduce((sum, i) => sum + (i.actualQty - i.systemQty), 0);

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Tạo đợt kiểm kê"
        subtitle="Nhập số lượng thực tế cho từng lô thuốc"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => navigate("/audit")}>
              <Icon name="arrow_back" size={16} /> Quay lại
            </button>
            <button id="btn-confirm-create-audit" className="btn btn-primary" onClick={handleConfirm}>
              <Icon name="check_circle" size={16} /> Xác nhận tạo đợt
            </button>
          </div>
        }
      />

      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          gap: 20,
          padding: "14px 20px",
          background: "rgba(30,64,175,0.04)",
          border: "1px solid rgba(30,64,175,0.12)",
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <div>
          <span className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Tổng lô</span>
          <p style={{ fontWeight: 700, color: "var(--primary)" }}>{items.length}</p>
        </div>
        <div style={{ width: 1, background: "var(--outline-variant)" }} />
        <div>
          <span className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Tổng chênh lệch</span>
          <p style={{ fontWeight: 700, color: totalDiff === 0 ? "#059669" : "var(--error)" }}>
            {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
          </p>
        </div>
        <div style={{ width: 1, background: "var(--outline-variant)" }} />
        <div>
          <span className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Lô lệch</span>
          <p style={{ fontWeight: 700, color: "var(--on-surface)" }}>
            {items.filter((i) => i.actualQty !== i.systemQty).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="wms-table">
          <thead>
            <tr>
              <th>Tên thuốc</th>
              <th>Mã lô</th>
              <th>Hệ thống</th>
              <th>Số thực tế</th>
              <th>Chênh lệch</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const diff = i.actualQty - i.systemQty;
              return (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.productName}</td>
                  <td style={{ color: "var(--on-surface-variant)", fontFamily: "monospace" }}>{i.batchName}</td>
                  <td style={{ fontWeight: 600 }}>{i.systemQty}</td>
                  <td>
                    <input
                      className="wms-input"
                      type="number"
                      style={{ width: 100 }}
                      value={i.actualQty}
                      onChange={(e) => handleChangeActual(i.id, Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        color: diff === 0 ? "#059669" : diff > 0 ? "#F59E0B" : "var(--error)",
                      }}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
