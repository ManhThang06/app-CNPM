import axios from "axios";

const BASE = "http://localhost:3000/api";

function getHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// ─── Export Requests ───────────────────────────────────────────────
export const getMyExportRequests = () =>
  axios.get(`${BASE}/export-requests/my`, { headers: getHeaders() });

export const createExportRequest = (items: { medicine_id: number; quantity: number }[]) =>
  axios.post(`${BASE}/export-requests`, { items }, { headers: getHeaders() });

export const getPendingExportRequests = () =>
  axios.get(`${BASE}/export-requests`, { headers: getHeaders() });

export const approveExportRequest = (id: number) =>
  axios.patch(`${BASE}/export-requests/${id}/approve`, {}, { headers: getHeaders() });

export const rejectExportRequest = (id: number, note: string) =>
  axios.patch(`${BASE}/export-requests/${id}/reject`, { note }, { headers: getHeaders() });

export const completeExportRequest = (
  id: number,
  exportItems: { batch_id: number; quantity: number }[]
) =>
  axios.patch(
    `${BASE}/export-requests/${id}/complete`,
    { exportItems },
    { headers: getHeaders() }
  );

// ─── Import Requests ───────────────────────────────────────────────
export const getImportRequests = () =>
  axios.get(`${BASE}/import-requests`, { headers: getHeaders() });

export const createImportRequest = (data: {
  medicine_id: number;
  quantity: number;
  batch_code?: string;
  expiry_date?: string;
  note?: string;
}) => axios.post(`${BASE}/import-requests`, data, { headers: getHeaders() });

export const receiveImportRequest = (id: number, data: object) =>
  axios.patch(`${BASE}/import-requests/${id}/receive`, data, { headers: getHeaders() });

export const rejectImportRequest = (id: number, note: string) =>
  axios.patch(`${BASE}/import-requests/${id}/reject`, { note }, { headers: getHeaders() });

// ─── Dashboard ─────────────────────────────────────────────────────
export const getDashboardSummary = () =>
  axios.get(`${BASE}/dashboard/summary`, { headers: getHeaders() });

// ─── Batches (FEFO) ────────────────────────────────────────────────
export const getBatchesByMedicine = (medicineId: number) =>
  axios.get(`${BASE}/batches?medicine_id=${medicineId}`, { headers: getHeaders() });

export const getAllBatches = () =>
  axios.get(`${BASE}/batches`, { headers: getHeaders() });

// ─── Inventory ─────────────────────────────────────────────────────
export const getInventory = () =>
  axios.get(`${BASE}/inventory`, { headers: getHeaders() });

// ─── Inventory Logs ────────────────────────────────────────────────
export const getInventoryLogs = (type?: "IMPORT" | "EXPORT" | "ADJUST") =>
  axios.get(`${BASE}/inventory-logs${type ? `?type=${type}` : ""}`, {
    headers: getHeaders(),
  });

// ─── Audits ────────────────────────────────────────────────────────
export const getAudits = () =>
  axios.get(`${BASE}/audits`, { headers: getHeaders() });

export const getAuditById = (id: number) =>
  axios.get(`${BASE}/audits/${id}`, { headers: getHeaders() });

export const createAudit = (
  items: { medicine_id: number; batch_id: number; system_qty: number; actual_qty: number }[],
  options?: { confirm?: boolean },
) =>
  axios.post(
    `${BASE}/audits`,
    { items, confirm: options?.confirm === true },
    { headers: getHeaders() },
  );

export const addAuditItem = (id: number, data: { medicine_id: number; batch_id: number; system_qty: number; actual_qty: number }) =>
  axios.post(`${BASE}/audits/${id}/items`, data, { headers: getHeaders() });

export const confirmAudit = (
  id: number,
  items?: { id: number; actual_qty: number }[],
) =>
  axios.patch(`${BASE}/audits/${id}/confirm`, { items }, { headers: getHeaders() });

