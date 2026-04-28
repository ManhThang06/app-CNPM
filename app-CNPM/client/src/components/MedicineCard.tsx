import { X, Pencil, ArchiveRestore } from "lucide-react";
import type { Medicine } from "../types/medicine";

type Props = {
  medicine: Medicine;
  role?: string;
  onEdit?: (medicine: Medicine) => void;
  onDelete?: (medicine: Medicine) => void;
  onRestore?: (medicine: Medicine) => void;
};

const BASE_URL = "http://localhost:3000";

export default function MedicineCard({
  medicine,
  role,
  onEdit,
  onDelete,
  onRestore,
}: Props) {
  return (
    <div
      className={`relative w-full h-66 flex flex-col items-center justify-center border rounded-2xl ${
        medicine.is_deleted
          ? "bg-red-100 border-red-300 opacity-70"
          : "bg-white border-gray-500"
      }`}
    >
      {/* 🔴 BADGE (KHÔNG bị grayscale) */}
      {Boolean(medicine.is_deleted) && (
        <div className="absolute top-1 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md z-20">
          Tạm ngừng nhập kho
        </div>
      )}
      {/* ACTION BUTTONS */}
      {role === "MANAGER" && (
        <div className="absolute top-2 right-2 flex gap-2">
          {!medicine.is_deleted ? (
            <>
              {/* EDIT */}
              <button
                onClick={() => onEdit?.(medicine)}
                className="p-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600"
              >
                <Pencil size={16} />
              </button>

              {/* DELETE */}
              <button
                onClick={() => onDelete?.(medicine)}
                className="p-1 rounded-full bg-red-50 hover:bg-red-100 text-red-500"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            /* 🔓 RESTORE */
            <button
              onClick={() => onRestore?.(medicine)}
              className="p-1 rounded-full bg-green-50 hover:bg-green-100 text-green-500"
            >
              <ArchiveRestore size={16} />
            </button>
          )}
        </div>
      )}

      <div
        className={`flex flex-col items-center ${
          medicine.is_deleted ? "grayscale opacity-60" : ""
        }`}
      >
        <img
          src={`${BASE_URL}${medicine.img_path}`}
          alt={medicine.name}
          className="flex-1 max-h-35 max-w-full object-contain mt-3"
        />

        <div className="p-3 text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {medicine.name}
          </h2>

          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {medicine.description}
          </p>
        </div>
      </div>
    </div>
  );
}
