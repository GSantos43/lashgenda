"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";
import { AnimatedModal } from "@/components/AnimatedModal";

interface AppointmentItem {
  id: number;
  serviceId: number | null;
  serviceName: string;
  price: number;
  duration: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  clientNotes: string;
  status: string;
  cancelReason: string;
  canceledBy: string;
}

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAYS_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function formatFullDatePT(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const day = String(d || 1).padStart(2, "0");
  const month = String(m || 1).padStart(2, "0");
  return `${WEEKDAYS_PT[dt.getDay()]}, ${day}/${month}`;
}

function formatPhoneBR(phone: string): string {
  const d = (phone || "").replace(/\D/g, "");
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return phone;
}

export default function AtendimentoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const appointmentId = Number(rawId);

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentItem | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadAppointment = async () => {
    try {
      const res = await fetch("/api/admin", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (data.authenticated) {
        const list: AppointmentItem[] = data.appointments || [];
        const found = list.find((a) => Number(a.id) === appointmentId) || null;
        setAppointment(found);
      }
    } catch (err) {
      console.error("Erro ao carregar atendimento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    } else {
      setLoading(false);
    }
  }, [appointmentId]);

  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

  const openWhatsAppClient = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, "");
    const full = clean.startsWith("55") ? clean : `55${clean}`;
    window.open(
      `https://api.whatsapp.com/send?phone=${full}&text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const updateStatus = async (newStatus: string, cancelReason = "") => {
    if (!appointment) return;
    try {
      setBusyAction(newStatus);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_appointment_status",
          id: appointment.id,
          status: newStatus,
          cancelReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppointment((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                cancelReason: cancelReason || prev.cancelReason,
              }
            : null
        );
        setConfirmCancelModal(false);
        showToast(data.message || "Status atualizado!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-[#111111] animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#78716C]">
          Carregando Atendimento...
        </p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#111111] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-full max-w-[380px] p-6 rounded-[26px] bg-white border border-[#EFECE6] space-y-4 shadow-xs">
          <h1 className="text-lg font-extrabold text-[#111111]">
            Atendimento não encontrado
          </h1>
          <p className="text-xs text-[#78716C]">
            Não encontramos nenhum agendamento com o código #{rawId}.
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="w-full py-3.5 rounded-2xl bg-[#141519] text-white text-xs font-bold smooth-press cursor-pointer"
          >
            Voltar ao Painel Executivo
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = appointment.status === "concluido";
  const isCanceled = appointment.status === "cancelado";

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] pb-16 font-sans">
      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 bg-[#0F1115] text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap w-max max-w-[92vw] animate-toast">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF8F5]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md px-5 pt-5 pb-4 border-b border-[#EFECE6] flex items-center justify-between animate-card">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-[#111111] hover:bg-black/5 smooth-press cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#78716C]">
                ATENDIMENTO #{appointment.id}
              </span>
              <h1 className="text-[18px] font-extrabold text-[#111111] leading-tight">
                Dados do Agendamento
              </h1>
            </div>
          </div>

          {/* Status Pill */}
          <span
            className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
              isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : isCanceled
                ? "bg-red-100 text-red-700"
                : "bg-[#EADCE0] text-[#574147]"
            }`}
          >
            {isCompleted
              ? "Concluído"
              : isCanceled
              ? "Cancelado"
              : "Agendado"}
          </span>
        </header>

        <main className="px-5 pt-5 space-y-4">
          {/* Cliente & Procedimento Highlight Card */}
          <section className="p-5 rounded-[26px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4 animate-card">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F2EFE9]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                  PROCEDIMENTO
                </span>
                <h2 className="text-[18px] font-extrabold text-[#111111] leading-snug">
                  {appointment.serviceName}
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78716C]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Duração estimada: {appointment.duration}</span>
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                  VALOR
                </span>
                <span className="text-[20px] font-extrabold text-[#111111]">
                  {formatBRL(appointment.price)}
                </span>
              </div>
            </div>

            {/* Info Rows */}
            <div className="space-y-3.5">
              {/* Data & Horário */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-[#111111]" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                    DATA & HORÁRIO
                  </span>
                  <p className="text-sm font-extrabold text-[#111111] mt-0.5 leading-snug">
                    {formatFullDatePT(appointment.date)}{" "}
                    <span className="text-[#9D5C6D]">
                      - {appointment.time}h
                    </span>
                  </p>
                </div>
              </div>

              {/* Cliente */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#111111]" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                    CLIENTE
                  </span>
                  <p className="text-sm font-extrabold text-[#111111] mt-0.5">
                    {appointment.clientName}
                  </p>
                  <p className="text-xs font-semibold text-[#78716C] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{formatPhoneBR(appointment.clientPhone)}</span>
                  </p>
                </div>
              </div>

              {/* Endereço Domicílio */}
              {appointment.clientAddress && (
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#111111]" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                      ENDEREÇO (ATENDIMENTO A DOMICÍLIO)
                    </span>
                    <p className="text-sm font-semibold text-[#111111] mt-0.5 leading-snug">
                      {appointment.clientAddress}
                    </p>
                  </div>
                </div>
              )}

              {/* Observações */}
              {appointment.clientNotes && (
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#111111]" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                      OBSERVAÇÕES / ALERGIAS
                    </span>
                    <p className="text-xs font-medium text-[#111111] mt-0.5 leading-relaxed">
                      {appointment.clientNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Motivo de cancelamento se cancelado */}
              {isCanceled && appointment.cancelReason && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-xs text-red-700 space-y-0.5">
                  <span className="font-extrabold uppercase text-[10px] block">
                    Motivo da Desmarcação
                  </span>
                  <p className="font-medium">{appointment.cancelReason}</p>
                </div>
              )}
            </div>
          </section>

          {/* Actions Section */}
          <section
            className="space-y-2.5 animate-card"
            style={{ animationDelay: "70ms" }}
          >
            <button
              type="button"
              onClick={() =>
                openWhatsAppClient(
                  appointment.clientPhone,
                  `Olá ${appointment.clientName}! ✨ Passando para falar sobre seu horário de *${appointment.serviceName}* no dia *${appointment.date
                    .split("-")
                    .reverse()
                    .join("/")}* às *${appointment.time}*.`
                )
              }
              className="w-full py-4 px-5 rounded-[20px] bg-[#D8F3DC] hover:bg-[#c7ebd0] border border-[#b7e4c7] text-[#111111] font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs smooth-press cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-[#059669]"
              >
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
              </svg>
              <span>Conversar com Cliente no WhatsApp</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {!isCompleted ? (
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => updateStatus("concluido")}
                  className="py-4 px-4 rounded-[20px] bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm smooth-press cursor-pointer"
                >
                  {busyAction === "concluido" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-[#10B981] stroke-[2.5]" />
                  )}
                  <span>Concluir Atendimento</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => updateStatus("agendado")}
                  className="py-4 px-4 rounded-[20px] bg-white border border-[#E5E0D8] hover:bg-[#F4F1EC] text-[#111111] font-bold text-xs flex items-center justify-center gap-2 smooth-press cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reabrir Horário</span>
                </button>
              )}

              {!isCanceled ? (
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => setConfirmCancelModal(true)}
                  className="py-4 px-4 rounded-[20px] bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm smooth-press cursor-pointer"
                >
                  <XCircle className="w-4 h-4 stroke-[2.2]" />
                  <span>Desmarcar</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => updateStatus("agendado")}
                  className="py-4 px-4 rounded-[20px] bg-white border border-[#E5E0D8] hover:bg-[#F4F1EC] text-[#111111] font-bold text-xs flex items-center justify-center gap-2 smooth-press cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Reativar Horário</span>
                </button>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Confirm Cancel Modal */}
      <AnimatedModal
        open={confirmCancelModal}
        onClose={() => setConfirmCancelModal(false)}
        roundedClass="rounded-[32px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-[17px] font-extrabold text-[#111111] leading-snug">
                Desmarcar Horário
              </h3>
              <p className="text-[12px] text-[#78716C] leading-snug mt-0.5">
                Confirme antes de desmarcar este atendimento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConfirmCancelModal(false)}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#F4F1EC] text-xs space-y-1.5">
          <p>
            <b>Cliente:</b> {appointment.clientName}
          </p>
          <p>
            <b>Procedimento:</b> {appointment.serviceName}
          </p>
          <p>
            <b>Data:</b> {appointment.date.split("-").reverse().join("/")} às{" "}
            {appointment.time}
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={busyAction === "cancelado"}
            onClick={() =>
              updateStatus("cancelado", "Desmarcado na página do atendimento")
            }
            className="w-full py-4 px-5 rounded-[18px] bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md smooth-press cursor-pointer"
          >
            {busyAction === "cancelado" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Confirmar e Desmarcar</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmCancelModal(false)}
            className="w-full py-2 text-center text-xs font-semibold text-[#57534E] hover:text-[#111111] cursor-pointer"
          >
            Voltar sem desmarcar
          </button>
        </div>
      </AnimatedModal>
    </div>
  );
}
