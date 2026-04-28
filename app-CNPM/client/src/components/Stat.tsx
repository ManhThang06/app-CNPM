type StatProps = {
  title: string;
  value: number;
  blue?: boolean;
  amber?: boolean;
  red?: boolean;
  green?: boolean;
};

export default function Stat({
  title,
  value,
  blue,
  amber,
  red,
  green,
}: StatProps) {
  return (
    <div className="bg-white p-4 rounded-xl border">
      <p className="text-xs text-gray-400">{title}</p>
      <p
        className={`text-xl font-bold ${
          blue
            ? "text-blue-600"
            : amber
              ? "text-amber-500"
              : red
                ? "text-red-500"
                : green
                  ? "text-green-400"
                  : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
