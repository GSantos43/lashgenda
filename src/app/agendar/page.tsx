"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Sparkles,
  User,
  Phone,
  AlertCircle,
  Search,
  XCircle,
  BookOpen,
} from "lucide-react";

interface StudioConfig {
  studioName: string;
  professionalName: string;
  tagline: string;
  address: string;
  whatsapp: string;
  logoUrl: string;
  badges: string[];
  themeMode: string;
  minAdvanceHours: number;
  portfolio: string[];
}

interface ServiceItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  imageUrl: string;
}

interface SlotItem {
  time: string;
  available: boolean;
  reason: string;
}

interface ClientAppointment {
  id: number;
  serviceName: string;
  price: number;
  duration: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  status: string;
}

function getTodayBrazil(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

function AgendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [initialLoading, setInitialLoading] = useState(true);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [todayMinDate, setTodayMinDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientNotes, setClientNotes] = useState<string>("");

  // Slots loading state
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [isFullDayBlocked, setIsFullDayBlocked] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<string>("");

  // Booking submission state
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState<ClientAppointment | null>(
    null
  );

  // Lookup / Cancel existing appointments modal state
  const [showLookupModal, setShowLookupModal] = useState<boolean>(false);
  const [lookupPhone, setLookupPhone] = useState<string>("");
  const [loadingLookup, setLoadingLookup] = useState<boolean>(false);
  const [lookupResults, setLookupResults] = useState<ClientAppointment[] | null>(
    null
  );
  const [lookupError, setLookupError] = useState<string>("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // Load initial studio & services data
  useEffect(() => {
    const today = getTodayBrazil();
    setTodayMinDate(today);
    setSelectedDate(today);
    async function init() {
      try {
        setInitialLoading(true);
        const res = await fetch("/api/public", { cache: "no-store" });
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.services && data.services.length > 0) {
          setServices(data.services);
          const querySrvId = searchParams.get("serviceId");
          if (
            querySrvId &&
            data.services.some((s: ServiceItem) => String(s.id) === querySrvId)
          ) {
            setSelectedServiceId(querySrvId);
          } else {
            setSelectedServiceId(String(data.services[0].id));
          }
        }
        if (searchParams.get("consultar") === "1") {
          setShowLookupModal(true);
        }
      } catch (err) {
        console.error("Erro ao carregar agenda:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    init();
  }, [searchParams]);

  // Load slots whenever selectedDate changes
  const fetchSlotsForDate = async (dateStr: string) => {
    if (!dateStr) return;
    try {
      setLoadingSlots(true);
      setSelectedTime("");
      const res = await fetch(`/api/slots?date=${dateStr}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setIsFullDayBlocked(Boolean(data.isFullDayBlocked));
      setBlockReason(data.blockReason || "");
      setSlots(data.slots || []);
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const selectedService = services.find(
    (s) => String(s.id) === String(selectedServiceId)
  );

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!selectedServiceId) {
      setBookingError("Selecione o procedimento desejado.");
      return;
    }
    if (!selectedDate || !selectedTime) {
      setBookingError("Selecione a data e um horário disponível.");
      return;
    }
    if (!clientName.trim() || clientName.trim().length < 2) {
      setBookingError("Informe seu nome completo.");
      return;
    }
    const digits = clientPhone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      setBookingError("Informe seu WhatsApp com DDD (ex: 11988887777).");
      return;
    }

    try {
      setSubmittingBooking(true);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: Number(selectedServiceId),
          date: selectedDate,
          time: selectedTime,
          clientName: clientName.trim(),
          clientPhone: digits,
          clientNotes: clientNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || "Não foi possível confirmar o agendamento.");
        fetchSlotsForDate(selectedDate);
        return;
      }

      setBookingSuccess(data.appointment);
      fetchSlotsForDate(selectedDate);
    } catch (err) {
      console.error("Erro ao confirmar agendamento:", err);
      setBookingError("Erro de conexão ao confirmar agendamento. Tente novamente.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleLookupAppointments = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    const digits = lookupPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setLookupError("Digite seu WhatsApp com DDD para consultar.");
      return;
    }
    try {
      setLoadingLookup(true);
      const res = await fetch(`/api/appointments?phone=${digits}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "Erro ao consultar agendamentos.");
        return;
      }
      setLookupResults(data.appointments || []);
    } catch (err) {
      console.error(err);
      setLookupError("Não foi possível consultar agora.");
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    try {
      setCancelingId(id);
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          clientPhone: lookupPhone,
          cancelReason: "Desmarcado pela cliente na consulta online",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLookupResults((prev) =>
          prev ? prev.filter((item) => item.id !== id) : []
        );
        fetchSlotsForDate(selectedDate);
      } else {
        alert(data.error || "Erro ao desmarcar horário.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelingId(null);
    }
  };

  const getWhatsAppConfirmationUrl = (appt: ClientAppointment) => {
    const phone = (config?.whatsapp || "11999999999").replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const fmtDate = appt.date.split("-").reverse().join("/");
    const msg = encodeURIComponent(
      `Olá ${config?.professionalName || ""}! ✨\nAcabei de agendar meu horário pelo site:\n\n💆‍♀️ *Procedimento:* ${appt.serviceName} (${formatBRL(appt.price)})\n📅 *Data:* ${fmtDate} às *${appt.time}*\n👩 *Cliente:* ${appt.clientName}`
    );
    return `https://wa.me/${fullPhone}?text=${msg}`;
  };

  const isLight = config?.themeMode === "light-rose";

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#120b10] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-rose-400 animate-spin mb-3" />
        <p className="text-sm font-bold uppercase tracking-wider text-rose-200">
          Carregando Agenda Online...
        </p>
        <p className="text-xs text-rose-300/60 mt-1">
          Sincronizando procedimentos e horários disponíveis
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pb-16 ${
        isLight ? "bg-[#fdf8f6] text-stone-900" : "bg-[#120b10] text-rose-50"
      }`}
    >
      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3.5 flex items-center justify-between ${
          isLight
            ? "bg-white/90 border-rose-200"
            : "bg-[#180f15]/90 border-rose-950/60"
        }`}
      >
        <button
          onClick={() => {
            setNavigatingBack(true);
            router.push("/");
          }}
          disabled={navigatingBack}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
            isLight
              ? "border-rose-200 text-stone-700 hover:bg-rose-50"
              : "border-rose-900/50 text-rose-200 hover:bg-rose-950/60"
          }`}
        >
          {navigatingBack ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
          ) : (
            <ArrowLeft className="w-4 h-4 text-rose-400" />
          )}
          <span>Voltar</span>
        </button>

        <span className="text-xs font-black uppercase tracking-widest text-rose-400">
          Agendamento Online
        </span>

        <button
          onClick={() => router.push("/catalogo")}
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition ${
            isLight
              ? "border-rose-200 text-rose-700 hover:bg-rose-50"
              : "border-rose-900/50 text-rose-300 hover:bg-rose-950/50"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-400" />
          <span>Catálogo</span>
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* STUDIO PROFILE HEADER (Inspired by Reference Site, tailored for 1 Lash Designer) */}
        <div
          className={`p-5 rounded-3xl border text-center space-y-3 shadow-xl ${
            isLight
              ? "bg-white border-rose-200"
              : "bg-[#1a1017] border-rose-900/40"
          }`}
        >
          <div className="w-20 h-20 mx-auto rounded-full p-0.5 bg-gradient-to-tr from-rose-400 via-amber-200 to-rose-500 shadow-lg">
            <img
              src={
                config?.logoUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
              }
              alt={config?.studioName}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-wider text-rose-400">
              {config?.studioName}
            </h1>
            <p className="text-xs font-semibold text-amber-200/90">
              Lash Designer: {config?.professionalName}
            </p>
            <p
              className={`text-[11px] mt-0.5 ${
                isLight ? "text-stone-500" : "text-rose-300/60"
              }`}
            >
              {config?.address}
            </p>
          </div>
          {config?.badges && config.badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {config.badges.slice(0, 3).map((b, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
                    isLight
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SUCCESS SCREEN IF BOOKING COMPLETED */}
        {bookingSuccess ? (
          <div
            className={`p-6 rounded-3xl border space-y-5 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
              isLight
                ? "bg-white border-emerald-300"
                : "bg-[#1a1017] border-emerald-500/40"
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Reserva Confirmada!
              </span>
              <h2 className="text-xl font-black">
                Tudo certo, {bookingSuccess.clientName}! ✨
              </h2>
              <p
                className={`text-xs ${
                  isLight ? "text-stone-600" : "text-rose-200/70"
                }`}
              >
                Seu horário já está reservado na agenda da{" "}
                {config?.professionalName}.
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border text-left space-y-2 text-xs ${
                isLight
                  ? "bg-rose-50/60 border-rose-200"
                  : "bg-[#120b10] border-rose-900/40"
              }`}
            >
              <div className="flex justify-between">
                <span className="text-rose-300/70">Procedimento:</span>
                <span className="font-bold text-rose-300">
                  {bookingSuccess.serviceName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-300/70">Valor:</span>
                <span className="font-black text-amber-300">
                  {formatBRL(bookingSuccess.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-300/70">Data e Horário:</span>
                <span className="font-bold">
                  {bookingSuccess.date.split("-").reverse().join("/")} às{" "}
                  {bookingSuccess.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-300/70">Duração estimada:</span>
                <span>{bookingSuccess.duration}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href={getWhatsAppConfirmationUrl(bookingSuccess)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprovante no WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  setBookingSuccess(null);
                  setSelectedTime("");
                }}
                className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold transition ${
                  isLight
                    ? "border-rose-200 text-stone-700 hover:bg-rose-50"
                    : "border-rose-900/50 text-rose-200 hover:bg-rose-950/50"
                }`}
              >
                Fazer Outro Agendamento
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmBooking} className="space-y-6">
            {/* STEP 1: SELECT SERVICE (Dropdown with Name & Price as requested!) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-rose-400 border-l-4 border-rose-500 pl-2.5">
                  1. Escolha o Procedimento
                </h2>
                <button
                  type="button"
                  onClick={() => router.push("/catalogo")}
                  className="text-[11px] text-rose-300/80 hover:text-rose-300 underline"
                >
                  Ver fotos no catálogo
                </button>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight
                    ? "bg-white border-rose-200"
                    : "bg-[#1a1017] border-rose-900/40"
                }`}
              >
                <label
                  htmlFor="select-servico"
                  className={`text-xs font-medium block ${
                    isLight ? "text-stone-600" : "text-rose-200/80"
                  }`}
                >
                  Selecione o serviço desejado na lista:
                </label>

                <div className="relative">
                  <select
                    id="select-servico"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-sm font-bold focus:outline-none focus:border-rose-400 transition appearance-none cursor-pointer ${
                      isLight
                        ? "bg-rose-50/50 border-rose-200 text-stone-900"
                        : "bg-[#120b10] border-rose-800/60 text-rose-50"
                    }`}
                  >
                    {services.map((srv) => (
                      <option
                        key={srv.id}
                        value={srv.id}
                        className="bg-[#1a1017] text-rose-50 py-2"
                      >
                        {srv.name} — {formatBRL(srv.price)}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-rose-400 text-xs font-bold">
                    ▼
                  </div>
                </div>

                {/* Compact preview of the selected service */}
                {selectedService && (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isLight
                        ? "bg-rose-50/40 border-rose-200/60"
                        : "bg-[#120b10]/70 border-rose-900/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedService.imageUrl ? (
                        <img
                          src={selectedService.imageUrl}
                          alt={selectedService.name}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-rose-400/30"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-rose-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {selectedService.name}
                        </p>
                        <p className="text-[11px] text-rose-300/70 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-400" />
                          <span>Duração: {selectedService.duration}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-400/30 text-rose-300 font-black text-xs">
                        {formatBRL(selectedService.price)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* STEP 2: DATE AND TIME */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-rose-400 border-l-4 border-rose-500 pl-2.5">
                2. Data e Horário
              </h2>

              <div
                className={`p-4 rounded-2xl border space-y-4 ${
                  isLight
                    ? "bg-white border-rose-200"
                    : "bg-[#1a1017] border-rose-900/40"
                }`}
              >
                <div>
                  <label
                    htmlFor="booking-date"
                    className={`text-xs font-medium block mb-1.5 ${
                      isLight ? "text-stone-600" : "text-rose-200/80"
                    }`}
                  >
                    Selecione o Dia
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    min={todayMinDate}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-rose-400 transition ${
                      isLight
                        ? "bg-rose-50/40 border-rose-200 text-stone-900"
                        : "bg-[#120b10] border-rose-800/60 text-rose-50"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isLight
                        ? "bg-rose-50/60 border-rose-200"
                        : "bg-[#120b10] border-rose-900/40"
                    }`}
                  >
                    <span className="text-xs font-semibold text-rose-200">
                      Horários disponíveis para agendamento
                    </span>
                    {loadingSlots && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Atualizando...</span>
                      </span>
                    )}
                  </div>

                  {loadingSlots ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 text-rose-400 animate-spin" />
                      <span className="text-xs text-rose-300/70">
                        Consultando disponibilidade da agenda...
                      </span>
                    </div>
                  ) : isFullDayBlocked ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-1">
                      <p className="text-xs font-bold text-red-300">
                        🚫 {blockReason || "Agenda fechada nesta data"}
                      </p>
                      <p className="text-[11px] text-red-200/70">
                        Por favor, escolha outra data no calendário acima.
                      </p>
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-rose-300/60 text-center py-4">
                      Nenhum horário cadastrado para este dia.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {slots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-3 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center ${
                              !slot.available
                                ? "opacity-40 cursor-not-allowed bg-stone-900/40 border-stone-800 text-stone-500 line-through"
                                : isSelected
                                ? "bg-gradient-to-r from-rose-400 to-amber-300 text-zinc-950 border-rose-300 shadow-lg shadow-rose-500/20 scale-[1.02]"
                                : isLight
                                ? "bg-white hover:bg-rose-50 border-rose-200 text-stone-800"
                                : "bg-[#120b10] hover:border-rose-400/60 border-rose-900/50 text-rose-100"
                            }`}
                          >
                            <span>{slot.time}</span>
                            {!slot.available && slot.reason && (
                              <span className="text-[9px] font-normal no-underline mt-0.5">
                                {slot.reason}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* STEP 3: CLIENT LOOKUP BANNER (Just like reference site) */}
            <section
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isLight
                  ? "bg-rose-50/70 border-rose-200"
                  : "bg-[#1a1017] border-rose-800/50"
              }`}
            >
              <div>
                <h2 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                  <span>📋 Já tem um horário marcado?</span>
                </h2>
                <p
                  className={`text-xs mt-0.5 ${
                    isLight ? "text-stone-600" : "text-rose-200/70"
                  }`}
                >
                  Consulte ou desmarque seus próximos agendamentos usando o
                  WhatsApp informado quando marcou.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLookupModal(true)}
                className="w-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-200 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition"
              >
                Consultar Meus Horários
              </button>
            </section>

            {/* STEP 4: CLIENT DETAILS */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-rose-400 border-l-4 border-rose-500 pl-2.5">
                3. Seus Dados
              </h2>

              <div
                className={`p-4 rounded-2xl border space-y-3.5 ${
                  isLight
                    ? "bg-white border-rose-200"
                    : "bg-[#1a1017] border-rose-900/40"
                }`}
              >
                <div>
                  <label className="text-xs text-rose-200/80 block mb-1 font-medium">
                    Seu Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Mariana Costa"
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:border-rose-400 ${
                        isLight
                          ? "bg-rose-50/30 border-rose-200 text-stone-900"
                          : "bg-[#120b10] border-rose-800/60 text-rose-50"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-rose-200/80 block mb-1 font-medium">
                    Seu WhatsApp com DDD *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: 11988887777"
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:border-rose-400 ${
                        isLight
                          ? "bg-rose-50/30 border-rose-200 text-stone-900"
                          : "bg-[#120b10] border-rose-800/60 text-rose-50"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-rose-200/80 block mb-1 font-medium">
                    Observação (Opcional)
                  </label>
                  <input
                    type="text"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Ex: Tenho cílios de outro profissional para remover"
                    className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-rose-400 ${
                      isLight
                        ? "bg-rose-50/30 border-rose-200 text-stone-900"
                        : "bg-[#120b10] border-rose-800/60 text-rose-50"
                    }`}
                  />
                </div>
              </div>
            </section>

            {bookingError && (
              <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center gap-2.5 text-xs text-red-200 font-medium">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* SUBMIT BUTTON WITH LOADING STATE */}
            <button
              type="submit"
              disabled={submittingBooking || loadingSlots}
              className="w-full bg-gradient-to-r from-rose-400 via-rose-300 to-amber-200 text-zinc-950 font-black p-4 rounded-2xl hover:brightness-105 transition shadow-xl shadow-rose-500/20 active:scale-98 text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submittingBooking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                  <span>Confirmando seu Agendamento...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  <span>Confirmar Agendamento</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>

      {/* MODAL: CONSULTAR / DESMARCAR HORÁRIOS */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1a1017] border border-rose-800/60 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-300">
                📋 Consultar Meus Agendamentos
              </h3>
              <button
                onClick={() => {
                  setShowLookupModal(false);
                  setLookupResults(null);
                  setLookupError("");
                }}
                className="text-xs text-rose-300/70 hover:text-rose-200 font-bold px-2 py-1"
              >
                Fechar ✕
              </button>
            </div>

            <form onSubmit={handleLookupAppointments} className="space-y-3">
              <p className="text-xs text-rose-200/70">
                Informe o número de WhatsApp com DDD usado no seu agendamento:
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="Ex: 11988887777"
                  className="flex-1 bg-[#120b10] border border-rose-800/60 rounded-xl p-3 text-sm text-rose-50 focus:outline-none focus:border-rose-400"
                />
                <button
                  type="submit"
                  disabled={loadingLookup}
                  className="px-4 py-3 rounded-xl bg-rose-500 text-zinc-950 font-black text-xs uppercase flex items-center gap-1.5"
                >
                  {loadingLookup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Buscar</span>
                </button>
              </div>
            </form>

            {lookupError && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">
                {lookupError}
              </p>
            )}

            {lookupResults !== null && (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pt-1">
                {lookupResults.length === 0 ? (
                  <p className="text-xs text-rose-300/60 text-center py-4">
                    Nenhum agendamento ativo encontrado para este WhatsApp.
                  </p>
                ) : (
                  lookupResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#120b10] border border-rose-900/50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-rose-200">
                            {item.serviceName}
                          </p>
                          <p className="text-[11px] text-rose-300/70">
                            📅 {item.date.split("-").reverse().join("/")} às{" "}
                            <b className="text-amber-300">{item.time}</b>
                          </p>
                        </div>
                        <span className="text-xs font-black text-rose-400">
                          {formatBRL(item.price)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={cancelingId === item.id}
                        onClick={() => handleCancelAppointment(item.id)}
                        className="w-full py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        {cancelingId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Desmarcando...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Desmarcar este horário</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#120b10] flex flex-col items-center justify-center p-6">
          <Loader2 className="w-9 h-9 text-rose-400 animate-spin mb-2" />
          <p className="text-xs text-rose-200 uppercase tracking-widest">
            Carregando Agenda...
          </p>
        </div>
      }
    >
      <AgendarContent />
    </Suspense>
  );
}
