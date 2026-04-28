interface Props {
  value: number;
  onChange: (value: number) => void;
}

export default function QuantityStepper({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200"
      >
        −
      </button>

      <input
        type="number"
        value={value}
        min={1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 flex-1 rounded-lg bg-slate-50 text-center border border-slate-200"
      />

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200"
      >
        +
      </button>
    </div>
  );
}
