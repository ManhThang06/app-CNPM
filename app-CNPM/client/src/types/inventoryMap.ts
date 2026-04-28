// Types for Inventory Map feature

export type CabinetStatus = "safe" | "near" | "expired" | "empty";

export interface MapBatchItem {
  id: number;
  batch_code: string;
  quantity: number;
  expiry_date: string;
  position: string;         // format: "F{floor}-{room}-M{cabinet}" e.g. "F1-A-M3"
  cabinet_is_full: boolean;
  medicine_id: number;
  medicine_name: string;
}

/** One batch entry displayed inside a cabinet modal */
export interface CabinetDrug {
  batchId: number;
  batchCode: string;
  medicineName: string;
  medicineId: number;
  quantity: number;
  expiryDate: string;
  status: CabinetStatus;
}

/** Aggregated info for a single cabinet cell */
export interface CabinetInfo {
  key: string;           // "F1-A-M3"
  label: string;         // "M3"
  floor: number;
  room: string;          // "A" | "B" | "C"
  status: CabinetStatus;
  isFull: boolean;
  drugs: CabinetDrug[];
  totalQuantity: number;
}
