"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  ExternalLink,
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
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [openingRideApp, setOpeningRideApp] = useState<"uber" | "99" | null>(
    null
  );
  const [rideMenuOpen, setRideMenuOpen] = useState(false);
  const rideMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        rideMenuRef.current &&
        !rideMenuRef.current.contains(e.target as Node)
      ) {
        setRideMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Geocode clientAddress in background so Uber and 99 deep links have exact dropoff coordinates
  useEffect(() => {
    const addr = appointment?.clientAddress?.trim();
    if (!addr) {
      setCoords(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function resolveCoordinates(rawAddress: string) {
      try {
        const cleanAddress = rawAddress.replace(/\([^)]*\)/g, "").trim();
        const apiKey =
          process.env.NEXT_PUBLIC_GEOAPIFY_KEY ||
          "3b4d69632b19443ba05956f3a749ebdb";
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          cleanAddress
        )}&lang=pt&filter=circle:-40.8442,-14.8619,35000&bias=proximity:-40.8442,-14.8619&limit=1&format=json&apiKey=${apiKey}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;
        const data = await res.json();
        const first = Array.isArray(data?.results) ? data.results[0] : null;
        if (
          first &&
          typeof first.lat === "number" &&
          typeof first.lon === "number"
        ) {
          return { lat: first.lat, lon: first.lon };
        }
      } catch {
        // ignore abort or network error
      }
      return null;
    }

    resolveCoordinates(addr).then((found) => {
      if (!cancelled && found) {
        setCoords(found);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [appointment?.clientAddress]);

  const handleOpenRideApp = async (provider: "uber" | "99") => {
    const addr = appointment?.clientAddress?.trim();
    if (!addr) return;

    setOpeningRideApp(provider);
    let resolved = coords;

    // Fallback instant lookup if user clicked before background geocode completed
    if (!resolved) {
      try {
        const cleanAddress = addr.replace(/\([^)]*\)/g, "").trim();
        const apiKey =
          process.env.NEXT_PUBLIC_GEOAPIFY_KEY ||
          "3b4d69632b19443ba05956f3a749ebdb";
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          cleanAddress
        )}&lang=pt&filter=circle:-40.8442,-14.8619,35000&bias=proximity:-40.8442,-14.8619&limit=1&format=json&apiKey=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const first = Array.isArray(data?.results) ? data.results[0] : null;
          if (
            first &&
            typeof first.lat === "number" &&
            typeof first.lon === "number"
          ) {
            resolved = { lat: first.lat, lon: first.lon };
            setCoords(resolved);
          }
        }
      } catch {
        // continue with text-only fallback
      }
    }

    const encodedAddr = encodeURIComponent(addr);
    const shortTitle = encodeURIComponent(addr.split(" - ")[0] || addr);

    if (provider === "uber") {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(addr);
        }
      } catch {
        // ignore clipboard permissions error
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent || ""
      );

      if (isMobile) {
        // Direct native app scheme so mobile browsers open the Uber app directly with dropoff marked
        const nativeUberUrl = resolved
          ? `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${resolved.lat}&dropoff[longitude]=${resolved.lon}&dropoff[nickname]=${shortTitle}&dropoff[formatted_address]=${encodedAddr}`
          : `uber://?action=setPickup&pickup=my_location&dropoff[nickname]=${shortTitle}&dropoff[formatted_address]=${encodedAddr}`;

        window.location.href = nativeUberUrl;
        showToast("Abrindo app da Uber com endereço marcado...");
        setTimeout(() => setOpeningRideApp(null), 600);
        return;
      }

      // Desktop/Web fallback: use Uber mobile web JSON dropoff format
      const dropJson = encodeURIComponent(
        JSON.stringify({
          latitude: resolved?.lat,
          longitude: resolved?.lon,
          addressLine1: addr.split(" - ")[0] || addr,
          addressLine2: addr,
        })
      );
      const webUberUrl = `https://m.uber.com/go/home?drop[0]=${dropJson}`;
      window.open(webUberUrl, "_blank", "noopener,noreferrer");
      showToast("Abrindo Uber (endereço também copiado!)");
      setOpeningRideApp(null);
      return;
    }

    // 99 App: copy address to clipboard as helpful backup & trigger 99 deep link with dropoff coordinates and title
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(addr);
      }
    } catch {
      // ignore clipboard permissions error
    }

    const deepLink99 = resolved
      ? `taxis99://call?dropoff_latitude=${resolved.lat}&dropoff_longitude=${resolved.lon}&dropoff_title=${encodedAddr}&deep_link_product_id=316`
      : `taxis99://call?dropoff_title=${encodedAddr}&deep_link_product_id=316`;

    window.location.href = deepLink99;
    showToast("Abrindo 99 com endereço marcado...");
    setTimeout(() => setOpeningRideApp(null), 600);
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
      <div className="min-h-screen bg-[#FAF8F5] text-[#111111] pb-16 font-sans">
        <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF8F5] animate-pulse">
          {/* Header Skeleton */}
          <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 px-5 pt-5 pb-4 border-b border-[#EFECE6] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 -ml-1.5 rounded-full bg-[#E8E2D9]" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-24 rounded bg-[#EDE8E0]" />
                <div className="h-5 w-44 rounded-lg bg-[#E8E2D9]" />
              </div>
            </div>
            <div className="h-7 w-20 rounded-full bg-[#EADCE0]/70" />
          </header>

          <main className="px-5 pt-5 space-y-4">
            {/* Highlight Card Skeleton */}
            <section className="p-5 rounded-[26px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F2EFE9]">
                <div className="space-y-2 flex-1">
                  <div className="h-2.5 w-24 rounded bg-[#EDE8E0]" />
                  <div className="h-5 w-44 rounded-lg bg-[#E8E2D9]" />
                  <div className="h-3.5 w-36 rounded bg-[#F3EFEA]" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-2.5 w-12 rounded bg-[#EDE8E0] ml-auto" />
                  <div className="h-6 w-20 rounded-lg bg-[#E8E2D9]" />
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Data & Horário Skeleton */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-2.5 w-24 rounded bg-[#EDE8E0]" />
                    <div className="h-4 w-40 rounded bg-[#E8E2D9]" />
                  </div>
                </div>

                {/* Cliente Skeleton */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-2.5 w-16 rounded bg-[#EDE8E0]" />
                    <div className="h-4 w-36 rounded bg-[#E8E2D9]" />
                    <div className="h-3 w-28 rounded bg-[#F3EFEA]" />
                  </div>
                </div>

                {/* Endereço + Mapa Skeleton */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2.5 w-40 rounded bg-[#EDE8E0]" />
                      <div className="h-4 w-52 rounded bg-[#E8E2D9]" />
                    </div>
                  </div>
                  <div className="w-full h-44 rounded-2xl bg-[#F3EFEA] border border-[#EFECE6]" />
                </div>
              </div>
            </section>

            {/* Action Buttons Skeleton */}
            <div className="space-y-2.5">
              <div className="h-[52px] w-full rounded-[20px] bg-[#D8F3DC]/70" />
              <div className="grid grid-cols-2 gap-2.5">
                <div className="h-[52px] rounded-[20px] bg-[#E2DDD5]" />
                <div className="h-[52px] rounded-[20px] bg-[#F3EFEA]" />
              </div>
            </div>
          </main>
        </div>
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
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
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

              {/* Endereço Domicílio + Mapa Google Maps */}
              {appointment.clientAddress && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-[#111111]" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                          ENDEREÇO (ATENDIMENTO A DOMICÍLIO)
                        </span>
                        <p className="text-sm font-semibold text-[#111111] mt-0.5 leading-snug">
                          {appointment.clientAddress}
                        </p>
                      </div>
                    </div>

                    {/* Select Personalizado Uber / 99 no lugar de Abrir Rota */}
                    <div className="relative shrink-0" ref={rideMenuRef}>
                      <button
                        type="button"
                        onClick={() => setRideMenuOpen((prev) => !prev)}
                        className="px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#EFECE6] text-[#111111] text-[11px] font-bold inline-flex items-center gap-1.5 shrink-0 smooth-press cursor-pointer"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-[#111111] text-white text-[9px] font-black tracking-tight">
                          Uber
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#FFB800] text-[#111111] text-[9px] font-black tracking-tight">
                          99
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#78716C] transition-transform duration-200 ${
                            rideMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {rideMenuOpen && (
                        <div className="absolute right-0 mt-2 w-44 p-2 rounded-2xl bg-white border border-[#EFECE6] shadow-[0_12px_32px_rgba(0,0,0,0.12)] z-30 space-y-2 animate-card">
                          <button
                            type="button"
                            disabled={openingRideApp !== null}
                            onClick={() => {
                              setRideMenuOpen(false);
                              handleOpenRideApp("uber");
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#111111] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs smooth-press cursor-pointer"
                          >
                            {openingRideApp === "uber" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-[10px] font-black tracking-tight text-white">
                                Uber
                              </span>
                            )}
                            <span>Abrir na Uber</span>
                          </button>

                          <button
                            type="button"
                            disabled={openingRideApp !== null}
                            onClick={() => {
                              setRideMenuOpen(false);
                              handleOpenRideApp("99");
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#FFB800] hover:bg-[#F2AE00] text-[#111111] font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs smooth-press cursor-pointer"
                          >
                            {openingRideApp === "99" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111111]" />
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#111111] text-[#FFB800] text-[10px] font-black tracking-tight">
                                99
                              </span>
                            )}
                            <span>Abrir no 99</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-64 rounded-2xl overflow-hidden border border-[#EFECE6] bg-[#FAF8F5] shadow-2xs">
                    <iframe
                      title={`Mapa para ${appointment.clientAddress}`}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        appointment.clientAddress
                      )}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
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
              className="w-full py-4 px-5 rounded-[20px] bg-[#059669] hover:bg-[#047857] text-[#D8F3DC] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm smooth-press cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-[#D8F3DC]"
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

        <div className="p-5 rounded-[22px] bg-[#F4F1EC] border border-[#E8E2D9] space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#E5DFD5]">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                PROCEDIMENTO
              </span>
              <h4 className="text-[16px] font-extrabold text-[#111111] mt-0.5">
                {appointment.serviceName}
              </h4>
            </div>
            <span className="text-[17px] font-extrabold text-[#111111] shrink-0">
              {formatBRL(appointment.price)}
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#111111] shrink-0 stroke-[2]" />
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                  DATA & HORÁRIO
                </span>
                <p className="text-[13px] font-semibold text-[#111111]">
                  {formatFullDatePT(appointment.date)} - {appointment.time}h
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[#111111] shrink-0 stroke-[2]" />
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                  CLIENTE
                </span>
                <p className="text-[13px] font-semibold text-[#111111]">
                  {appointment.clientName} •{" "}
                  {formatPhoneBR(appointment.clientPhone)}
                </p>
              </div>
            </div>
          </div>
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
