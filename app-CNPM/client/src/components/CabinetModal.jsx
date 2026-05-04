import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { Icon } from "./UI";
import { setCabinetFull, moveMedicine, adjustMedicine } from "../api/inventoryMapApi";
import { WAREHOUSE_FLOORS } from "../constants/warehouse";

const API_BASE = "http://localhost:3000/api";

function getHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function aggregateMedicines(rows, cabinetId) {
  return rows
    .filter((item) => item.position === cabinetId && Number(item.quantity) > 0)
    .map((item) => ({
      id: item.id,
      medicineId: item.medicine_id,
      medicineName: item.medicine_name,
      batchCode: item.batch_code,
      quantity: item.quantity,
      expiryDate: item.expiry_date,
    }));
}

export default function CabinetModal({ cabinet, cabinetId, onClose, onRemoved }) {
  const resolvedCabinetId = cabinetId || cabinet?.key;
  const cabinetLabel = cabinet?.label || resolvedCabinetId;

  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [isFull, setIsFull] = useState(cabinet?.isFull || false);

  // Move states
  const [movingItem, setMovingItem] = useState(null);
  const [moveQty, setMoveQty] = useState(0);
  const [moveFloor, setMoveFloor] = useState(1);
  const [moveRoom, setMoveRoom] = useState("A");
  const [moveCabinet, setMoveCabinet] = useState("M1");

  // Adjust states
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);

  const user = useSelector((state) => state.auth.user);
  const isStorekeeper = user?.role === "STOREKEEPER";

  useEffect(() => {
    setIsFull(cabinet?.isFull || false);
  }, [cabinet]);

  const fetchCabinetMedicines = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/inventory/map`, {
        headers: getHeaders(),
      });
      const data = aggregateMedicines(res.data, resolvedCabinetId);
      setMedicines(data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải danh sách thuốc trong tủ"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resolvedCabinetId) {
      fetchCabinetMedicines();
    }
  }, [resolvedCabinetId]);

  async function handleToggleFull() {
    const newVal = !isFull;
    try {
      await setCabinetFull(resolvedCabinetId, newVal);
      setIsFull(newVal);
      toast.success(newVal ? "Đã đánh dấu tủ đầy" : "Đã bỏ đánh dấu tủ đầy");
      onRemoved?.(); 
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật trạng thái tủ"));
    }
  }

  async function handleMove() {
    if (!movingItem) return;
    const targetPos = `F${moveFloor}-${moveRoom}-${moveCabinet}`;
    if (targetPos === resolvedCabinetId) {
      toast.error("Vị trí đích phải khác vị trí hiện tại");
      return;
    }
    if (moveQty <= 0 || moveQty > movingItem.quantity) {
      toast.error("Số lượng dời không hợp lệ");
      return;
    }

    try {
      await moveMedicine({
        batchId: movingItem.id,
        toPosition: targetPos,
        quantity: moveQty
      });
      toast.success("Dời tủ thành công");
      setMovingItem(null);
      fetchCabinetMedicines();
      onRemoved?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể dời tủ"));
    }
  }

  async function handleAdjust() {
    if (!adjustingItem) return;
    if (adjustQty < 0) {
      toast.error("Số lượng không hợp lệ");
      return;
    }

    try {
      await adjustMedicine({
        batchId: adjustingItem.id,
        newQuantity: adjustQty
      });
      toast.success("Cập nhật số lượng thành công");
      setAdjustingItem(null);
      fetchCabinetMedicines();
      onRemoved?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật số lượng"));
    }
  }

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="metric-card"
        style={{
          width: "min(700px, 100%)",
          maxHeight: "88vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>
              Tủ thuốc
            </div>
            <h2 className="font-headline" style={{ fontSize: "1.35rem", fontWeight: 800 }}>
              {cabinetLabel}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isStorekeeper && (
              <button
                type="button"
                className={`btn ${isFull ? "btn-danger" : "btn-secondary"}`}
                onClick={handleToggleFull}
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              >
                <Icon name={isFull ? "lock" : "lock_open"} size={16} />
                {isFull ? "Tủ đã đầy" : "Đánh dấu tủ đầy"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="btn btn-ghost"
              style={{ width: 36, height: 36, padding: 0, justifyContent: "center" }}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "28px 0", textAlign: "center", color: "var(--on-surface-variant)" }}>
            Đang tải danh sách thuốc...
          </div>
        ) : medicines.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", color: "var(--on-surface-variant)" }}>
            Tủ này hiện chưa có thuốc.
          </div>
        ) : (
          <table className="wms-table">
            <thead>
              <tr>
                <th>Tên thuốc</th>
                <th>Mã lô</th>
                <th>Số lượng</th>
                <th>Hạn sử dụng</th>
                {isStorekeeper && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine, index) => (
                <tr key={medicine.id || index}>
                  <td style={{ fontWeight: 600 }}>{medicine.medicineName}</td>
                  <td>{medicine.batchCode || "—"}</td>
                  <td style={{ fontWeight: 700 }}>{medicine.quantity}</td>
                  <td style={{ color: "var(--primary)", fontWeight: 600 }}>
                    {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  {isStorekeeper && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: 4, color: "var(--primary)" }} 
                          title="Dời tủ"
                          onClick={() => { setMovingItem(medicine); setMoveQty(medicine.quantity); }}
                        >
                          <Icon name="move_up" size={18} />
                        </button>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: 4, color: "#4CA1AF" }} 
                          title="Chỉnh sửa số lượng"
                          onClick={() => { setAdjustingItem(medicine); setAdjustQty(medicine.quantity); }}
                        >
                          <Icon name="edit" size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Move Form Overlay */}
        {movingItem && (
          <div style={{ background: "var(--surface-container-high)", padding: 16, borderRadius: 12, border: "1px solid var(--primary)" }}>
            <h3 style={{ marginBottom: 12, fontSize: "1rem" }}>Dời thuốc: {movingItem.medicineName}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="text-label-sm">Số lượng dời</label>
                <input type="number" value={moveQty} onChange={(e) => setMoveQty(Number(e.target.value))} max={movingItem.quantity} min={1} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="text-label-sm">Vị trí đích</label>
                <div style={{ display: "flex", gap: 4 }}>
                  <select value={moveFloor} onChange={(e) => setMoveFloor(Number(e.target.value))} style={{ flex: 1 }}>
                    {WAREHOUSE_FLOORS.map(f => <option key={f.floor} value={f.floor}>{f.shortName}</option>)}
                  </select>
                  <select value={moveRoom} onChange={(e) => setMoveRoom(e.target.value)} style={{ flex: 1 }}>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                  </select>
                  <select value={moveCabinet} onChange={(e) => setMoveCabinet(e.target.value)} style={{ flex: 1 }}>
                    {Array.from({ length: 10 }, (_, i) => `M${i + 1}`).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setMovingItem(null)}>Huỷ</button>
              <button className="btn btn-primary" onClick={handleMove}>Xác nhận dời</button>
            </div>
          </div>
        )}

        {/* Adjust Form Overlay */}
        {adjustingItem && (
          <div style={{ background: "var(--surface-container-high)", padding: 16, borderRadius: 12, border: "1px solid #4CA1AF" }}>
            <h3 style={{ marginBottom: 12, fontSize: "1rem" }}>Điều chỉnh số lượng: {adjustingItem.medicineName}</h3>
            <div style={{ marginBottom: 12 }}>
              <label className="text-label-sm">Số lượng thực tế</label>
              <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(Number(e.target.value))} min={0} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setAdjustingItem(null)}>Huỷ</button>
              <button className="btn btn-primary" onClick={handleAdjust} style={{ background: "#4CA1AF", border: "none" }}>Cập nhật</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
