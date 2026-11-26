"use client";

import React, { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { AnimatedModal } from "@/components/AnimatedModal";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (newDate: string) => void;
  minDate?: string; // YYYY-MM-DD
  label?: string; // Custom trigger text override
  variant?: "banner" | "pill" | "input" | "compact";
  title?: string;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function parseLocalYYYYMMDD(dateStr: string): Date {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date();
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

function formatToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayBR(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "Escolher a data";
  return dateStr.split("-").reverse().join("/");
}

export function DatePicker({
  value,
  onChange,
  minDate,
  label,
  variant = "input",
  title = "Selecione uma data",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const hasValidValue = Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
  const selectedDateObj = hasValidValue ? parseLocalYYYYMMDD(value) : undefined;
  const [month, setMonth] = useState<Date>(() =>
    hasValidValue ? startOfMonth(parseLocalYYYYMMDD(value)) : startOfMonth(new Date())
  );

  const todayObj = useMemo(() => startOfDay(new Date()), []);
  const minDateObj = useMemo(
    () => (minDate && /^\d{4}-\d{2}-\d{2}$/.test(minDate) ? startOfDay(parseLocalYYYYMMDD(minDate)) : undefined),
    [minDate]
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let curr = gridStart;
    while (curr <= gridEnd) {
      days.push(curr);
      curr = addDays(curr, 1);
    }
    return days;
  }, [month]);

  const handleOpen = () => {
    setMonth(
      hasValidValue
        ? startOfMonth(parseLocalYYYYMMDD(value))
        : startOfMonth(new Date())
    );
    setOpen(true);
  };

  const handleSelectDay = (day: Date) => {
    if (minDateObj && isBefore(startOfDay(day), minDateObj)) return;
    const formatted = formatToYYYYMMDD(day);
    onChange(formatted);
    setOpen(false);
  };

  const selectQuickOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const formatted = formatToYYYYMMDD(d);
    if (minDate && formatted < minDate) return;
    setMonth(startOfMonth(d));
    onChange(formatted);
    setOpen(false);
  };

  const monthLabel = format(month, "MMMM yyyy", { locale: ptBR });
  const capitalizedMonthLabel =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <>
      {variant === "banner" && (
        <button
          type="button"
          onClick={handleOpen}
          className={`w-full py-3.5 px-4 rounded-[18px] font-extrabold text-[15px] flex items-center justify-between gap-2.5 smooth-press cursor-pointer transition ${
            hasValidValue
              ? "bg-[#09090B] hover:bg-zinc-800 text-white shadow-sm"
              : "bg-[#F3EFEA] hover:bg-[#EBE5DE] text-[#111111]"
          }`}
        >
          <span className="flex items-center gap-2.5 mx-auto">
            <CalendarIcon
              className={`w-4 h-4 stroke-[2.2] ${
                hasValidValue ? "text-white" : "text-[#111111]"
              }`}
            />
            <span>{label || formatDisplayBR(value)}</span>
            <ChevronDown
              className={`w-4 h-4 stroke-[2.2] ${
                hasValidValue ? "text-white/80" : "text-[#78716C]"
              }`}
            />
          </span>
        </button>
      )}

      {variant === "pill" && (
        <button
          type="button"
          onClick={handleOpen}
          className="px-3.5 py-2 rounded-full bg-white border border-[#E5E0D8] shadow-2xs text-[12px] font-bold text-[#111111] flex items-center gap-1.5 hover:bg-[#F4F1EC] smooth-press cursor-pointer transition"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#78716C]" />
          <span>{label || formatDisplayBR(value)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
        </button>
      )}

      {variant === "compact" && (
        <button
          type="button"
          onClick={handleOpen}
          className="bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] flex items-center gap-2 smooth-press cursor-pointer transition"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#78716C]" />
          <span>{label || formatDisplayBR(value)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
        </button>
      )}

      {variant === "input" && (
        <button
          type="button"
          onClick={handleOpen}
          className="w-full bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-bold text-[#111111] flex items-center justify-between gap-2 smooth-press cursor-pointer transition"
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
            <span>{label || formatDisplayBR(value)}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
        </button>
      )}

      <AnimatedModal
        open={open}
        onClose={() => setOpen(false)}
        maxWidthClass="max-w-[360px]"
        roundedClass="rounded-[28px]"
        paddingClass="p-5"
        centerOnMobile
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#EADCE0] flex items-center justify-center text-[#111111] shrink-0">
              <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold text-[#111111] leading-tight">
                {title}
              </h3>
              <p className="text-[11px] font-semibold text-[#78716C]">
                {hasValidValue
                  ? `Selecionado: ${formatDisplayBR(value)}`
                  : "Toque em um dia abaixo"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar calendário"
            className="w-8 h-8 rounded-full bg-[#F4F1EC] hover:bg-[#E7E2DA] flex items-center justify-center text-[#111111] smooth-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => selectQuickOffset(0)}
            className="py-2 px-3 rounded-xl bg-[#F4F1EC] hover:bg-[#EADCE0] text-[#111111] text-[11px] font-extrabold transition smooth-press cursor-pointer"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => selectQuickOffset(1)}
            className="py-2 px-3 rounded-xl bg-[#F4F1EC] hover:bg-[#EADCE0] text-[#111111] text-[11px] font-extrabold transition smooth-press cursor-pointer"
          >
            Amanhã
          </button>
          <button
            type="button"
            onClick={() => selectQuickOffset(7)}
            className="py-2 px-3 rounded-xl bg-[#F4F1EC] hover:bg-[#EADCE0] text-[#111111] text-[11px] font-extrabold transition smooth-press cursor-pointer"
          >
            +7 dias
          </button>
        </div>

        {/* Custom Month Navigation Header + Calendar Grid */}
        <div className="bg-[#FAF8F5] rounded-[22px] p-3.5 border border-[#EFECE6] space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <button
              type="button"
              onClick={() => setMonth((m) => startOfMonth(subMonths(m, 1)))}
              aria-label="Mês anterior"
              className="w-8 h-8 rounded-xl bg-white border border-[#E5E0D8] hover:bg-[#F3EFEA] flex items-center justify-center text-[#111111] smooth-press cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            </button>

            <span className="text-[13px] font-extrabold text-[#111111] tracking-tight">
              {capitalizedMonthLabel}
            </span>

            <button
              type="button"
              onClick={() => setMonth((m) => startOfMonth(addMonths(m, 1)))}
              aria-label="Próximo mês"
              className="w-8 h-8 rounded-xl bg-white border border-[#E5E0D8] hover:bg-[#F3EFEA] flex items-center justify-center text-[#111111] smooth-press cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((wd) => (
              <div
                key={wd}
                className="text-[11px] font-bold text-[#78716C] py-1 select-none"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = formatToYYYYMMDD(day);
              const isCurrentMonth = isSameMonth(day, month);
              const isSelected = Boolean(
                selectedDateObj && isSameDay(day, selectedDateObj)
              );
              const isToday = isSameDay(day, todayObj);
              const isDisabled = Boolean(
                minDateObj && isBefore(startOfDay(day), minDateObj)
              );

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`h-10 w-full rounded-[12px] text-[13px] flex items-center justify-center transition smooth-press ${
                    isDisabled
                      ? "text-[#D0CBC3] opacity-45 cursor-not-allowed"
                      : isSelected
                      ? "bg-[#111111] text-white font-extrabold shadow-sm cursor-pointer"
                      : isToday
                      ? "bg-[#EADCE0]/60 text-[#9D5C6D] font-extrabold underline cursor-pointer hover:bg-[#EADCE0]"
                      : isCurrentMonth
                      ? "text-[#111111] font-semibold hover:bg-[#EADCE0]/50 cursor-pointer"
                      : "text-[#A8A29E] font-medium opacity-70 hover:bg-[#EFECE6] cursor-pointer"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </AnimatedModal>
    </>
  );
}
