type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  onChange,
}: PaginationProps) {
  return (
    <div className="flex gap-2 items-center">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Prev
      </button>

      <span className="text-sm">
        {page} / {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
