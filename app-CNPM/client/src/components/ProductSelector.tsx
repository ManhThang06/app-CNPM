import type { Medicine } from "../types/medicine";

interface Props {
  products: Medicine[];
  value: number | null; // 👈 FIX ở đây
  onChange: (id: number) => void;
}

export default function ProductSelector({ products, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-500 uppercase">
        Loại thuốc
      </label>

      <select
        value={value ?? ""} // 👈 tránh warning React
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
      >
        {/* placeholder */}
        <option value="" disabled>
          -- Chọn thuốc --
        </option>

        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
