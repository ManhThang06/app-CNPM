import { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { RootState } from "../../../app/store";
import { ROLES } from "../../../constants/role";
import {
  PageHeader,
  MetricCard,
  StatusPill,
  Icon,
  EmptyState,
} from "../../../components/UI";
import {
  getInventory,
  createImportRequest,
} from "../../../api/medicineRequestApi";
import { getMedicines } from "../../../api/medicineApi";
import type { Medicine } from "../../../types/medicine";

/* ─── Giữ nguyên types ─── */
type Batch = {
  id: number;
  productName: string;
  batchName: string;
  quantity: number;
  expiryDate: string;
  position: string;
  status: "safe" | "near" | "expired";
  medicine_id: number;
};

type InventoryApiBatch = {
  id: number;
  productName?: string;
  batchName?: string;
  batch_code?: string;
  quantity: number;
  expiryDate?: string;
  position?: string;
  status?: Batch["status"];
  medicine_id: number;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const response = (error as { response?: { data?: { message?: unknown } } })
    ?.response;
  return typeof response?.data?.message === "string"
    ? response.data.message
    : fallback;
};

/* ─── Giữ nguyên getStatus ─── */
const getStatus = (date: string): "safe" | "near" | "expired" => {
  const today = new Date();
  const exp = new Date(date);
  const diff = (exp.getTime() - today.getTime()) / (1000 * 3600 * 24);
  if (diff < 0) return "expired";
  if (diff <= 30) return "near";
  return "safe";
};

const statusLabel: Record<string, string> = {
  safe: "An toàn",
  near: "Gần hết hạn",
  expired: "Hết hạn",
};

export default function InventoryPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const role = user?.role;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldOpenImportRequest =
    role === ROLES.MANAGER && searchParams.get("action") === "import-request";

  /* ─── State ─── */
  const [batches, setBatches] = useState<Batch[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ keyword: "" });

  // Load inventory từ API
  useEffect(() => {
    getInventory()
      .then((res) => {
        const data: Batch[] = res.data.map((b: InventoryApiBatch) => ({
          id: b.id,
          productName: b.productName || "—",
          batchName: b.batchName || b.batch_code || "—",
          quantity: Number(b.quantity) || 0,
          expiryDate: b.expiryDate
            ? new Date(b.expiryDate).toISOString().split("T")[0]
            : "",
          position: b.position || "—",
          status:
            (b.status as "safe" | "near" | "expired") ||
            getStatus(b.expiryDate ?? ""),
          medicine_id: b.medicine_id,
        }));
        setBatches(data);
      })
      .catch((err) =>
        alert(err.response?.data?.message || "Lỗi tải dữ liệu kho"),
      )
      .finally(() => setLoading(false));
  }, []);

  // Load medicines cho dropdown
  useEffect(() => {
    getMedicines("active")
      .then((res) => setMedicines(res.data))
      .catch(() => {});
  }, []);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchKeyword =
        !filters.keyword ||
        `${b.productName} ${b.batchName}`
          .toLowerCase()
          .includes(filters.keyword.toLowerCase());
      return matchKeyword;
    });
  }, [batches, filters]);

  const stats = useMemo(() => {
    let totalQuantity = 0,
      near = 0,
      expired = 0;
    filteredBatches.forEach((b) => {
      totalQuantity += Number(b.quantity) || 0;
      if (b.status === "near") near++;
      if (b.status === "expired") expired++;
    });
    return {
      totalBatches: filteredBatches.length,
      totalQuantity,
      near,
      expired,
    };
  }, [filteredBatches]);

  // ─── Import Request modal (Manager) ───
  const [openRequest, setOpenRequest] = useState(shouldOpenImportRequest);
  const [requestForm, setRequestForm] = useState({
    medicine_id: 0,
    quantity: 1,
    batch_code: "",
    expiry_date: "",
    note: "",
  });

  useEffect(() => {
    if (!shouldOpenImportRequest) return;
    setSearchParams({}, { replace: true });
  }, [setSearchParams, shouldOpenImportRequest]);

  const handleSendImportRequest = async () => {
    if (!requestForm.medicine_id) return;
    try {
      await createImportRequest(requestForm);
      alert("Đã gửi yêu cầu nhập kho!");
      setOpenRequest(false);
      setRequestForm({
        medicine_id: 0,
        quantity: 1,
        batch_code: "",
        expiry_date: "",
        note: "",
      });
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Lỗi khi gửi yêu cầu"));
    }
  };

  if (!user)
    return (
      <div className="page" style={{ color: "var(--error)" }}>
        Chưa đăng nhập
      </div>
    );

  return (
    <div className="page animate-fade-in">
      {/* ─── Header ─── */}
      <PageHeader
        title="Quản lý kho"
        subtitle="Tổng quan và danh sách lô thuốc trong kho"
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/inventory/map")}
            >
              <Icon name="map" size={16} /> Sơ đồ kho
            </button>
            {role === ROLES.MANAGER && (
              <button
                id="btn-import-request"
                className="btn btn-primary"
                onClick={() => setOpenRequest(true)}
              >
                <Icon name="notification_add" size={16} /> Gửi thông báo nhập
                kho
              </button>
            )}
          </>
        }
      />

      {/* ─── Stats ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <MetricCard
          label="Tổng lô"
          value={loading ? "—" : stats.totalBatches}
          icon="layers"
          color="var(--primary)"
        />
        <MetricCard
          label="Tồn kho"
          value={loading ? "—" : stats.totalQuantity}
          icon="inventory_2"
          color="var(--secondary)"
        />
        <MetricCard
          label="Gần hết hạn"
          value={loading ? "—" : stats.near}
          icon="schedule"
          color="#F59E0B"
          borderColor={stats.near > 0 ? "#F59E0B" : undefined}
        />
        <MetricCard
          label="Hết hạn"
          value={loading ? "—" : stats.expired}
          icon="dangerous"
          color="var(--error)"
          borderColor={stats.expired > 0 ? "var(--error)" : undefined}
        />
      </div>

      {/* ─── Filter bar ─── */}
      <div className="filter-bar">
        <div style={{ position: "relative" }}>
          <Icon
            name="search"
            size={16}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--outline)",
              pointerEvents: "none",
            }}
          />
          <input
            className="wms-input"
            style={{ paddingLeft: 34, width: 240 }}
            placeholder="Tìm theo tên hoặc mã lô..."
            value={filters.keyword}
            onChange={(e) =>
              setFilters({ ...filters, keyword: e.target.value })
            }
          />
        </div>

        <button
          className="btn btn-ghost"
          onClick={() => setFilters({ keyword: "" })}
        >
          <Icon name="refresh" size={16} /> Reset
        </button>
      </div>

      {/* ─── Table ─── */}
      <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--on-surface-variant)",
            }}
          >
            Đang tải dữ liệu kho...
          </div>
        ) : (
          <table className="wms-table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Tên thuốc</th>
                <th>Số lượng</th>
                <th>Hạn sử dụng</th>
                <th>Trạng thái</th>
                <th>Vị trí</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "40px 0" }}
                  >
                    <EmptyState
                      icon="inventory_2"
                      message="Không có lô thuốc nào"
                    />
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.batchName}</td>
                    <td>{b.productName}</td>
                    <td style={{ fontWeight: 600 }}>{b.quantity}</td>
                    <td>{b.expiryDate}</td>
                    <td>
                      <StatusPill
                        status={b.status}
                        label={statusLabel[b.status]}
                      />
                    </td>
                    <td style={{ color: "var(--on-surface-variant)" }}>
                      {b.position}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Manager modal (import request) ─── */}
      {openRequest && role === ROLES.MANAGER && (
        <div className="modal-overlay">
          <div className="modal-box-sm wms-form">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2
                className="font-headline"
                style={{ fontWeight: 700, fontSize: "1.1rem" }}
              >
                Gửi thông báo nhập kho
              </h2>
              <button
                className="btn btn-ghost"
                style={{ padding: 4 }}
                onClick={() => setOpenRequest(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  className="text-label-sm"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Chọn thuốc
                </label>
                <select
                  value={requestForm.medicine_id}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      medicine_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>-- Chọn thuốc --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    flex: 1,
                  }}
                >
                  <label
                    className="text-label-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    Mã lô
                  </label>
                  <input
                    placeholder="VD: B123-2024"
                    value={requestForm.batch_code}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        batch_code: e.target.value,
                      })
                    }
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    flex: 1,
                  }}
                >
                  <label
                    className="text-label-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    Hạn sử dụng
                  </label>
                  <input
                    type="date"
                    value={requestForm.expiry_date}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        expiry_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  className="text-label-sm"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Số lượng
                </label>
                <input
                  type="number"
                  min={1}
                  value={requestForm.quantity}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  className="text-label-sm"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú thêm..."
                  value={requestForm.note}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, note: e.target.value })
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setOpenRequest(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSendImportRequest}
              >
                <Icon name="send" size={16} /> Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
