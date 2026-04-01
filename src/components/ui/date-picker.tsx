export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  format?: string;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <div className="relative w-full min-w-[120px]">
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Selecionar data"
        className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 w-full h-10 min-w-[120px]"
      />
      {value && (
        <button
          type="button"
          aria-label="Limpar data"
          onClick={() => onChange("")}
          className="datepicker-x-btn"
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#2563eb",
            border: "none",
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
