import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Icon, EmptyState } from "../../components/UI";
import { getAudits, getAuditById, confirmAudit } from "../../api/medicineRequestApi";
import { ROUTES } from "../../constants/routes";

type AuditItem = { id: number; productName: string; batchName: string; systemQty: number; actualQty: number };
type AuditSession = { id: number; createdAt: string; status: string; itemCount: number; items: AuditItem[] };

export default function StockAuditPage() {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<AuditSession | null>(null);
  const [mode, setMode] = useState<"list" | "audit" | "report">("list");
  const [filters, setFilters] = useState({ from: "", to: "" });

  const loadSessions = () => {
    getAudits().then((res) => {
      setSessions(res.data.map((s: any) => ({
        id: s.id,
        createdAt: s.created_at,
        status: s.status,
        itemCount: s.item_count,
        items: []
      })));
    }).catch(console.error);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const date = new Date(s.createdAt);
      const matchFrom = !filters.from || date >= new Date(filters.from);
      const matchTo = !filters.to || date <= new Date(filters.to);
      return matchFrom && matchTo;
    });
  }, [sessions, filters]);

  const handleChangeActual = (id: number, value: number) => {
    if (!selectedSession) return;
    setSelectedSession({ ...selectedSession, items: selectedSession.items.map((i) => i.id === id ? { ...i, actualQty: value } : i) });
  };

  const handleConfirm = async () => {
    if (!selectedSession) return;
    try {
      await confirmAudit(
        selectedSession.id,
        selectedSession.items.map((item) => ({
          id: item.id,
          actual_qty: item.actualQty,
        })),
      );
      alert("Xác nhận đợt kiểm kê thành công!");
      setSelectedSession(null);
      setMode("list");
      loadSessions();
      navigate(ROUTES.INVENTORY);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi xác nhận kiểm kê");
    }
  };

  const handleSelectSession = async (session: AuditSession) => {
    try {
      const res = await getAuditById(session.id);
      const items: AuditItem[] = res.data.items.map((i: any) => ({
        id: i.id, // item id
        productName: i.medicine_name,
        batchName: i.batch_code,
        systemQty: i.system_qty,
        actualQty: i.actual_qty ?? i.system_qty
      }));
      setSelectedSession({ ...session, items });
      setMode("report");
    } catch (err) {
      alert("Lỗi tải chi tiết phiên kiểm kê");
    }
  };

  const totalDiff = selectedSession?.items.reduce((sum, i) => sum + (i.actualQty - i.systemQty), 0) || 0;
  const totalItemsDiff = selectedSession?.items.filter((i) => i.actualQty !== i.systemQty).length || 0;

  /* ─── List view ─── */
  if (mode === "list") {
    return (
      <div className="page animate-fade-in">
        <PageHeader
          title="Kiểm kê kho"
          subtitle="Quản lý các đợt kiểm kê kho thuốc"
          actions={
            <button id="btn-create-audit" className="btn btn-primary" onClick={() => navigate("/audit/create")}>
              <Icon name="add" size={16} /> Tạo đợt kiểm kê
            </button>
          }
        />

        {/* Filter */}
        <div className="filter-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label className="text-label-sm" style={{ color: "var(--on-surface-variant)", whiteSpace: "nowrap" }}>Từ ngày</label>
            <input className="wms-input" type="date" style={{ width: 165 }} value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <Icon name="arrow_forward" size={16} style={{ color: "var(--outline)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label className="text-label-sm" style={{ color: "var(--on-surface-variant)", whiteSpace: "nowrap" }}>Đến ngày</label>
            <input className="wms-input" type="date" style={{ width: 165 }} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <button className="btn btn-ghost" onClick={() => setFilters({ from: "", to: "" })}>
            <Icon name="refresh" size={16} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="wms-table">
            <thead>
              <tr>
                <th>ID đợt kiểm kê</th>
                <th>Thời gian tạo</th>
                <th>Số lô</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr><td colSpan={4}><EmptyState icon="fact_check" message="Chưa có đợt kiểm kê nào" /></td></tr>
              ) : (
                filteredSessions.map((s) => (
                  <tr
                    key={s.id}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ fontWeight: 700 }}>#{s.id}</td>
                    <td>{new Date(s.createdAt).toLocaleString()}</td>
                    <td>{s.itemCount} lô</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`wms-badge ${s.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`} style={{ marginRight: 10 }}>
                        {s.status === 'CONFIRMED' ? 'Đã duyệt' : 'Đang mở'}
                      </span>
                      <button className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={(e) => { e.stopPropagation(); handleSelectSession(s); }}>
                        <Icon name="visibility" size={14} /> Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ─── Detail / Audit view ─── */
  return (
    <div className="page animate-fade-in">
      <PageHeader
        title={mode === "audit" ? "Kiểm kê kho" : "Báo cáo kiểm kê"}
        subtitle={selectedSession?.createdAt}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setMode("list")}>
              <Icon name="arrow_back" size={16} /> Quay lại
            </button>
            {mode === "report" && selectedSession?.status === "OPEN" && (
              <button className="btn btn-primary" onClick={() => setMode("audit")}>
                <Icon name="edit" size={16} /> Bắt đầu kiểm kê
              </button>
            )}
            {mode === "audit" && (
              <button id="btn-confirm-audit" className="btn btn-primary" onClick={handleConfirm}>
                <Icon name="check_circle" size={16} /> Xác nhận hoàn tất
              </button>
            )}
          </div>
        }
      />

      {/* Summary (report mode) */}
      {mode === "report" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div className="metric-card">
            <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>Tổng số lô</div>
            <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800 }}>{selectedSession?.items.length ?? 0}</div>
          </div>
          <div className="metric-card" style={{ borderBottom: totalItemsDiff > 0 ? "4px solid #F59E0B" : undefined }}>
            <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>Số lô lệch</div>
            <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800, color: totalItemsDiff > 0 ? "#F59E0B" : "#059669" }}>{totalItemsDiff}</div>
          </div>
          <div className="metric-card" style={{ borderBottom: totalDiff !== 0 ? `4px solid ${totalDiff < 0 ? "var(--error)" : "#F59E0B"}` : undefined }}>
            <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>Tổng chênh lệch</div>
            <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800, color: totalDiff < 0 ? "var(--error)" : totalDiff > 0 ? "#F59E0B" : "#059669" }}>
              {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
            </div>
          </div>
        </div>
      )}

      {/* Audit table */}
      <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="wms-table">
          <thead>
            <tr>
              <th>Tên thuốc</th>
              <th>Mã lô</th>
              <th>Hệ thống</th>
              <th>Thực tế</th>
              <th>Chênh lệch</th>
            </tr>
          </thead>
          <tbody>
            {selectedSession?.items.map((i) => {
              const diff = i.actualQty - i.systemQty;
              return (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.productName}</td>
                  <td style={{ color: "var(--on-surface-variant)", fontFamily: "monospace" }}>{i.batchName}</td>
                  <td style={{ fontWeight: 600 }}>{i.systemQty}</td>
                  <td>
                    {mode === "audit" ? (
                      <input
                        className="wms-input"
                        type="number"
                        style={{ width: 100 }}
                        value={i.actualQty}
                        onChange={(e) => handleChangeActual(i.id, Number(e.target.value))}
                      />
                    ) : (
                      <span style={{ fontWeight: 600 }}>{i.actualQty}</span>
                    )}
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
