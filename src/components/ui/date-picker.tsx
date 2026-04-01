"use client";

import ReactDatePicker from "react-datepicker";
import { ptBR } from "date-fns/locale";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  format?: string;
}

function parseIsoDate(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function formatDateToIso(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  format = "dd/MM/yyyy",
}: DatePickerProps) {
  const selectedDate = parseIsoDate(value);

  return (
    <div className="relative w-full min-w-[120px]">
      <ReactDatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => onChange(date ? formatDateToIso(date) : "")}
        dateFormat={format}
        locale={ptBR}
        isClearable
        clearButtonClassName="datepicker-clear-btn"
        ariaLabelClose="Limpar data"
        placeholderText={format}
        showPopperArrow={false}
        popperClassName="datepicker-popper"
        wrapperClassName="w-full"
        aria-label="Selecionar data"
        className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 w-full h-10 min-w-[120px]"
      />
    </div>
  );
}
