"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Trash2,
  CheckCheck,
} from "lucide-react";

interface WhatsappEventItem {
  id: number;
  type: string;
  appointmentId?: number | null;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface AppointmentItem {
  id: number;
  date: string;
  time: string;
  clientPhone: string;
  clientName: string;
}

export default function AdminNotificacoesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<WhatsappEventItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (data.authenticated) {
        setEvents(data.whatsappEvents || []);
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resolveAppointmentId = (ev: WhatsappEventItem): number | null => {
    if (ev.appointmentId) return ev.appointmentId;
    const matched =
      appointments.find(
        (a) =>
          a.date === ev.date &&
          a.time === ev.time &&
          a.clientPhone === ev.clientPhone
      ) ||
      appointments.find(
        (a) => a.date === ev.date && a.time === ev.time
      ) ||
      appointments.find(
        (a) =>
          a.clientPhone === ev.clientPhone &&
          a.clientName.toLowerCase() === ev.clientName.toLowerCase()
      );
    return matched ? matched.id : null;
  };

  const handleOpenNotification = async (ev: WhatsappEventItem) => {
    // Optimistically mark as read
    if (!ev.read) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === ev.id ? { ...item, read: true } : item
        )
      );
      fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_notification_read",
          id: ev.id,
        }),
      }).catch(() => {});
    }

    const apptId = resolveAppointmentId(ev);
    if (apptId) {
      router.push(`/atendimento/${apptId}`);
    }
  };

  const handleMarkAllRead = async () => {
    setBusyAction("mark-all");
    setEvents((prev) => prev.map((ev) => ({ ...ev, read: true })));
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_notifications_read" }),
    });
    setBusyAction(null);
  };

  const handleClearAll = async () => {
    setBusyAction("clear-all");
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_whatsapp_events" }),
    });
    setEvents([]);
    setBusyAction(null);
  };

  const openWhatsAppClient = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, "");
    const full = clean.startsWith("55") ? clean : `55${clean}`;
    window.open(
      `https://api.whatsapp.com/send?phone=${full}&text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-[#111111] animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#78716C]">
          Carregando Notificações...
        </p>
      </div>
    );
  }

  const unreadCount = events.filter((e) => !e.read).length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] pb-16 font-sans">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF8F5]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md px-5 pt-5 pb-4 border-b border-[#EFECE6] flex items-center justify-between animate-card">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              aria-label="Voltar"
              className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-[#111111] hover:bg-black/5 smooth-press cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div>
              <h1 className="text-[18px] font-extrabold text-[#111111] leading-tight">
                Todas as Notificações
              </h1>
              <span className="block text-[11px] font-semibold text-[#78716C]">
                {unreadCount > 0
                  ? `${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`
                  : "Todas lidas"}
              </span>
            </div>
          </div>

          {events.length > 0 && (
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={busyAction === "mark-all"}
                  onClick={handleMarkAllRead}
                  title="Marcar todas como lidas"
                  className="px-3 py-2 rounded-xl bg-[#F4F1EC] hover:bg-[#EAE5DD] text-[#111111] text-[11px] font-bold flex items-center gap-1.5 smooth-press cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Ler todas</span>
                </button>
              )}
              <button
                type="button"
                disabled={busyAction === "clear-all"}
                onClick={handleClearAll}
                title="Limpar todas as notificações"
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 smooth-press cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        <main className="px-5 pt-5 space-y-3">
          {events.length === 0 ? (
            <div className="p-10 rounded-[24px] bg-white border border-[#EFECE6] text-center space-y-2.5 shadow-2xs animate-card">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#F4F1EC] flex items-center justify-center text-[#78716C]">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-sm font-extrabold text-[#111111]">
                Nenhuma notificação por aqui
              </p>
              <p className="text-xs text-[#78716C]">
                Novos agendamentos e desmarcações aparecerão nesta lista.
              </p>
            </div>
          ) : (
            events.map((ev, idx) => {
              const isRead = Boolean(ev.read);
              const apptId = resolveAppointmentId(ev);

              return (
                <div
                  key={ev.id}
                  style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                  onClick={() => handleOpenNotification(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleOpenNotification(ev);
                  }}
                  className={`p-4 rounded-[22px] bg-white border transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer animate-card smooth-card ${
                    isRead
                      ? "opacity-55 border-[#EFECE6] shadow-none"
                      : "opacity-100 border-[#E5E0D8] shadow-[0_4px_14px_rgba(0,0,0,0.035)]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                      )}
                      {(!isRead || ev.type === "cancelamento_cliente") && (
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            ev.type === "cancelamento_cliente"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {ev.type === "cancelamento_cliente"
                            ? "Desmarcado"
                            : "Novo Agendamento"}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-[#A8A29E]">
                        {isRead ? "Lida" : "Nova"}
                      </span>
                    </div>

                    <p className="text-[14px] font-extrabold text-[#111111] truncate mt-1.5">
                      {ev.clientName}
                    </p>
                    <p className="text-xs font-medium text-[#78716C] truncate">
                      {ev.serviceName}
                    </p>
                    <p className="text-[11px] font-bold text-[#111111] mt-0.5">
                      {ev.date.split("-").reverse().join("/")} às {ev.time}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWhatsAppClient(
                          ev.clientPhone,
                          `Olá ${ev.clientName}! ✨ Recebi a atualização do seu horário de ${ev.serviceName}.`
                        );
                      }}
                      aria-label="Chamar no WhatsApp"
                      className="w-9 h-9 rounded-xl bg-[#F4F1EC] hover:bg-[#E7E2DA] text-[#111111] flex items-center justify-center smooth-press cursor-pointer"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 text-[#10B981]"
                      >
                        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                      </svg>
                    </button>

                    {apptId && (
                      <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
