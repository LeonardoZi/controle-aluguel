import DatePickerLib from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";
import { parse, format } from "date-fns";

export interface DatePickerProps {
  value: string; // yyyy-mm-dd
  onChange: (value: string) => void;
  format?: string;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  // Converte yyyy-mm-dd para Date
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : null;


  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <DatePickerLib
        selected={selected}
        onChange={(date: Date | null) => {
          if (!date) return onChange("");
          onChange(format(date, "yyyy-MM-dd"));
        }}
        dateFormat="dd/MM/yyyy"
        placeholderText="dd/mm/aaaa"
        className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 w-full h-10 min-w-[120px]"
        locale={ptBR}
        showPopperArrow={false}
        // Remove o botão de limpar padrão
        isClearable={false}
      />
      {value && (
        <button
          type="button"
          aria-label="Limpar data"
          onClick={() => onChange("")}
          className="datepicker-x-btn"
          style={{
            position: 'absolute',
    right: 8, // Ajustado para não ficar colado na borda
    top: '50%', // Move o topo para o meio do input
    transform: 'translateY(-50%)', // Puxa o botão de volta metade da sua própria altura
    background: '#2563eb',
    border: 'none',
    borderRadius: '50%',
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 2,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
          }}
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
