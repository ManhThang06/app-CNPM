import axios from "axios";
import type { MapBatchItem } from "../types/inventoryMap";

const BASE = "http://localhost:3000/api/inventory";

function getHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

/** GET /api/inventory/map — all batches with position data */
export const getInventoryMap = async (): Promise<MapBatchItem[]> => {
  const res = await axios.get<MapBatchItem[]>(`${BASE}/map`, {
    headers: getHeaders(),
  });
  return res.data;
};

/**
 * PUT /api/inventory/cabinets/:key/full
 * key = position string e.g. "F1-A-M3"
 */
export const setCabinetFull = async (
  key: string,
  isFull: boolean
): Promise<void> => {
  await axios.put(
    `${BASE}/cabinets/${encodeURIComponent(key)}/full`,
    { is_full: isFull },
    { headers: getHeaders() }
  );
};

export const moveMedicine = async (data: { batchId: number, toPosition: string, quantity: number }) => {
  return await axios.post(`${BASE}/move`, data, { headers: getHeaders() });
};

export const adjustMedicine = async (data: { batchId: number, newQuantity: number, note?: string }) => {
  return await axios.patch(`${BASE}/adjust`, data, { headers: getHeaders() });
};
