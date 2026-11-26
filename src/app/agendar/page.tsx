"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  MessageCircle,
  User,
  AlertCircle,
  Search,
  XCircle,
  Pencil,
  Sunrise,
  Sun,
  Moon,
  IdCard,
  MessageSquare,
  PenLine,
  CalendarCheck,
  ArrowRight,
  X,
  ListChecks,
  Check,
  Smile,
  Sparkles,
  MapPin,
} from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { AnimatedModal } from "@/components/AnimatedModal";
import { ScrollArea } from "@/components/ScrollArea";

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
  clientAddress?: string;
  status: string;
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

const MONTHS_SHORT_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const WEEKDAYS_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const WEEKDAYS_SHORT_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

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

function parseDateParts(dateStr: string) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      day: 22,
      monthIndex: 9,
      year: 2024,
      weekdayIndex: 2,
    };
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return {
    day: d,
    monthIndex: (m || 1) - 1,
    year: y,
    weekdayIndex: dt.getDay(),
  };
}

function formatMonthYearUpper(dateStr: string): string {
  const { monthIndex, year } = parseDateParts(dateStr);
  return `${MONTHS_PT[monthIndex].toUpperCase()} ${year}`;
}

function formatLongDateChip(dateStr: string): string {
  const { day, monthIndex, weekdayIndex } = parseDateParts(dateStr);
  return `${day} de ${MONTHS_PT[monthIndex]} • ${WEEKDAYS_PT[weekdayIndex]}`;
}

function formatShortSubtitleDate(dateStr: string): string {
  const { day, monthIndex, weekdayIndex } = parseDateParts(dateStr);
  return `${WEEKDAYS_SHORT_PT[weekdayIndex]}, ${day} de ${MONTHS_SHORT_PT[monthIndex]}`;
}

function formatModalDateAndTime(dateStr: string, timeStr: string): string {
  const { day, monthIndex, weekdayIndex } = parseDateParts(dateStr);
  const dd = String(day).padStart(2, "0");
  const mm = String(monthIndex + 1).padStart(2, "0");
  return `${WEEKDAYS_SHORT_PT[weekdayIndex]}, ${dd}/${mm} - ${timeStr}h`;
}

function AgendarSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] pb-12 font-sans">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF8F5] relative animate-pulse">
        {/* Header + Stepper Skeleton */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 border-b border-[#EFECE6]/80">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E8E2D9]" />
              <div className="h-5 w-40 rounded-lg bg-[#E8E2D9]" />
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E8E2D9]" />
          </div>

          <div className="px-5 pb-3.5 pt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#EADCE0]" />
              <div className="h-3.5 w-12 rounded bg-[#E8E2D9]" />
            </div>
            <div className="h-[2px] flex-1 bg-[#E8E2D9] rounded-full mx-1" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#D6CFC5]" />
              <div className="h-3.5 w-16 rounded bg-[#E8E2D9]" />
            </div>
            <div className="h-[1.5px] flex-1 bg-[#E8E2D9] rounded-full mx-1" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#E8E2D9]" />
              <div className="h-3.5 w-12 rounded bg-[#E8E2D9]" />
            </div>
          </div>
        </header>

        <main className="px-5 pt-3 space-y-6">
          {/* Chosen Procedure Card Skeleton */}
          <div className="p-4 rounded-[22px] bg-[#EADCE0]/70 flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-[#D8C5CA] shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-2.5 w-28 rounded bg-[#C9B3B9]" />
                <div className="h-4 w-40 rounded bg-[#C9B3B9]" />
                <div className="h-3.5 w-20 rounded bg-[#C9B3B9]" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/80 shrink-0" />
          </div>

          {/* Selecione o dia Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded-lg bg-[#E8E2D9]" />
              <div className="h-3 w-20 rounded bg-[#E8E2D9]" />
            </div>
            <div className="h-[52px] w-full rounded-[18px] bg-[#EDE8E0]" />
          </div>

          {/* Horários disponíveis Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 rounded-lg bg-[#E8E2D9]" />
              <div className="h-3 w-24 rounded bg-[#E8E2D9]" />
            </div>
            <div className="p-4 rounded-[22px] bg-white space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="h-2.5 w-16 rounded bg-[#E8E2D9]" />
              <div className="grid grid-cols-4 gap-2.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-11 rounded-[14px] bg-[#F3EFEA]"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Seus dados Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-48 rounded-lg bg-[#E8E2D9]" />
              <div className="h-3 w-20 rounded bg-[#E8E2D9]" />
            </div>
            <div className="space-y-2.5">
              <div className="h-[66px] rounded-[20px] bg-white p-4 space-y-2">
                <div className="h-2.5 w-24 rounded bg-[#EDE8E0]" />
                <div className="h-4 w-44 rounded bg-[#F3EFEA]" />
              </div>
              <div className="h-[66px] rounded-[20px] bg-white p-4 space-y-2">
                <div className="h-2.5 w-36 rounded bg-[#EDE8E0]" />
                <div className="h-4 w-36 rounded bg-[#F3EFEA]" />
              </div>
              <div className="h-[66px] rounded-[20px] bg-white p-4 space-y-2">
                <div className="h-2.5 w-40 rounded bg-[#EDE8E0]" />
                <div className="h-4 w-52 rounded bg-[#F3EFEA]" />
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                <div className="col-span-2 h-[66px] rounded-[20px] bg-white p-4 space-y-2">
                  <div className="h-2.5 w-14 rounded bg-[#EDE8E0]" />
                  <div className="h-4 w-12 rounded bg-[#F3EFEA]" />
                </div>
                <div className="col-span-3 h-[66px] rounded-[20px] bg-white p-4 space-y-2">
                  <div className="h-2.5 w-28 rounded bg-[#EDE8E0]" />
                  <div className="h-4 w-32 rounded bg-[#F3EFEA]" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button Skeleton */}
          <div className="h-14 w-full rounded-[20px] bg-[#E2DDD5]" />
        </main>
      </div>
    </div>
  );
}
function formatPhoneMask(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function AgendarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [enterKey, setEnterKey] = useState(0);

  // Reset booking success and form state whenever entering /agendar (or returning via browser/router)
  const resetBookingState = () => {
    setBookingSuccess(null);
    setShowReviewModal(false);
    setBookingError("");
    setSelectedDate("");
    setSelectedTime("");
    setClientName("");
    setClientPhone("");
    setClientAddress("");
    setClientNotes("");
  };

  useEffect(() => {
    resetBookingState();
    setEnterKey((k) => k + 1);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handlePageShow = () => {
      resetBookingState();
    };
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePageShow);
    };
  }, []);

  const [initialLoading, setInitialLoading] = useState(true);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [showServicePicker, setShowServicePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [todayMinDate, setTodayMinDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientAddress, setClientAddress] = useState<string>("");
  const [addressStreetQuery, setAddressStreetQuery] = useState<string>("");
  const [addressNumber, setAddressNumber] = useState<string>("");
  const [addressComplement, setAddressComplement] = useState<string>("");
  const [addressVerifiedBase, setAddressVerifiedBase] = useState<{
    street: string;
    suburb: string;
    city: string;
    state: string;
    postcode: string;
    formatted: string;
  } | null>(null);
  const [geoSuggestions, setGeoSuggestions] = useState<
    Array<{
      placeId: string;
      street: string;
      suburb: string;
      city: string;
      state: string;
      postcode: string;
      line1: string;
      line2: string;
      formatted: string;
      housenumber?: string;
    }>
  >([]);
  const [loadingGeo, setLoadingGeo] = useState<boolean>(false);
  const [showGeoDropdown, setShowGeoDropdown] = useState<boolean>(false);
  const [clientNotes, setClientNotes] = useState<string>("");

  // Slots loading state
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [isFullDayBlocked, setIsFullDayBlocked] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<string>("");

  // Review modal state (Figma node 1-2)
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Booking submission state
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] =
    useState<ClientAppointment | null>(null);

  // Lookup / Cancel existing appointments modal state
  const [showLookupModal, setShowLookupModal] = useState<boolean>(false);
  const [lookupPhone, setLookupPhone] = useState<string>("");
  const [loadingLookup, setLoadingLookup] = useState<boolean>(false);
  const [lookupResults, setLookupResults] = useState<
    ClientAppointment[] | null
  >(null);
  const [lookupError, setLookupError] = useState<string>("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [confirmCancelClientAppt, setConfirmCancelClientAppt] =
    useState<ClientAppointment | null>(null);

  // Load initial studio & services data
  useEffect(() => {
    const today = getTodayBrazil();
    setTodayMinDate(today);
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
            const classic = data.services.find((s: ServiceItem) =>
              s.name.toLowerCase().includes("clássico")
            );
            setSelectedServiceId(
              String(classic ? classic.id : data.services[0].id)
            );
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
      const res = await fetch(`/api/slots?date=${dateStr}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setIsFullDayBlocked(Boolean(data.isFullDayBlocked));
      setBlockReason(data.blockReason || "");
      const loadedSlots: SlotItem[] = data.slots || [];
      setSlots(loadedSlots);

      setSelectedTime((prev) => {
        if (
          prev &&
          loadedSlots.some((s) => s.time === prev && s.available)
        ) {
          return prev;
        }
        const eleven = loadedSlots.find(
          (s) => s.time === "11:00" && s.available
        );
        if (eleven) return eleven.time;
        const firstAvail = loadedSlots.find((s) => s.available);
        return firstAvail ? firstAvail.time : "";
      });
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

  const formatBRLShort = (val: number) => {
    const num = Number(val || 0);
    if (Number.isInteger(num)) {
      return `R$ ${num}`;
    }
    return formatBRL(num);
  };

  const phoneDigits = clientPhone.replace(/\D/g, "");

  // Keep clientAddress synchronized whenever verified street, number, or complement changes
  useEffect(() => {
    if (!addressVerifiedBase) {
      setClientAddress("");
      return;
    }
    const numPart = addressNumber.trim() || "S/N";
    const streetName =
      addressVerifiedBase.street || addressVerifiedBase.formatted;
    const areaParts = [
      addressVerifiedBase.suburb,
      addressVerifiedBase.city && addressVerifiedBase.state
        ? `${addressVerifiedBase.city} - ${addressVerifiedBase.state}`
        : addressVerifiedBase.city || addressVerifiedBase.state,
      addressVerifiedBase.postcode,
    ].filter(Boolean);

    let full = `${streetName}, ${numPart}`;
    if (areaParts.length > 0) {
      full += ` - ${areaParts.join(", ")}`;
    }
    if (addressComplement.trim()) {
      full += ` (${addressComplement.trim()})`;
    }
    setClientAddress(full);
  }, [addressVerifiedBase, addressNumber, addressComplement]);

  // Debounced Geoapify address autocomplete
  useEffect(() => {
    const q = addressStreetQuery.trim();
    if (
      addressVerifiedBase &&
      q === (addressVerifiedBase.street || addressVerifiedBase.formatted)
    ) {
      setGeoSuggestions([]);
      setLoadingGeo(false);
      return;
    }
    if (q.length < 3) {
      setGeoSuggestions([]);
      setLoadingGeo(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoadingGeo(true);
        const apiKey =
          process.env.NEXT_PUBLIC_GEOAPIFY_KEY ||
          "3b4d69632b19443ba05956f3a749ebdb";
        // Scoped strictly to Vitória da Conquista - BA (25km radius around city center -14.8619, -40.8442)
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          q
        )}&lang=pt&filter=circle:-40.8442,-14.8619,25000&bias=proximity:-40.8442,-14.8619&limit=6&format=json&apiKey=${apiKey}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          setGeoSuggestions([]);
          return;
        }
        const data = await res.json();
        const rawList = Array.isArray(data?.results) ? data.results : [];
        const mapped = rawList
          .map((item: Record<string, unknown>, idx: number) => {
            const street = String(
              item.street || item.name || item.address_line1 || ""
            ).trim();
            const suburb = String(
              item.suburb || item.district || item.quarter || ""
            ).trim();
            const city = String(
              item.city || item.town || item.municipality || ""
            ).trim();
            const state = String(item.state_code || item.state || "").trim();
            const postcode = String(item.postcode || "").trim();
            const formatted = String(item.formatted || "").trim();
            const line1 = String(
              item.address_line1 || street || formatted
            ).trim();
            const line2 = String(
              item.address_line2 ||
                [suburb, city && state ? `${city} - ${state}` : city, postcode]
                  .filter(Boolean)
                  .join(", ")
            ).trim();
            const housenumber = item.housenumber
              ? String(item.housenumber).trim()
              : undefined;

            return {
              placeId: String(item.place_id || `${line1}-${idx}`),
              street: street || line1,
              suburb,
              city,
              state,
              postcode,
              line1,
              line2,
              formatted: formatted || `${line1}, ${line2}`,
              housenumber,
            };
          })
          .filter(
            (item: { line1: string }) => Boolean(item.line1)
          );

        setGeoSuggestions(mapped);
      } catch {
        // ignore abort errors
      } finally {
        setLoadingGeo(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addressStreetQuery, addressVerifiedBase]);

  const isFormReady = Boolean(
    selectedServiceId &&
      selectedDate &&
      selectedTime &&
      clientName.trim().length >= 2 &&
      phoneDigits.length >= 10 &&
      phoneDigits.length <= 11 &&
      addressVerifiedBase &&
      addressNumber.trim().length >= 1 &&
      clientAddress.trim().length >= 5
  );

  // Validate form and open "Conferir Agendamento" modal (Figma node 1-2)
  const handleOpenReviewModal = (e: React.FormEvent) => {
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
      setBookingError("Informe seu nome completo para confirmação.");
      return;
    }
    const digits = clientPhone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      setBookingError("Informe seu WhatsApp com DDD (ex: (11) 98765-4321).");
      return;
    }
    if (!addressVerifiedBase) {
      setBookingError(
        "Digite sua rua ou CEP e selecione uma opção válida na lista de sugestões do mapa."
      );
      return;
    }
    if (!addressNumber.trim()) {
      setBookingError(
        "Informe o número do imóvel (ou digite S/N caso não possua número)."
      );
      return;
    }

    setShowReviewModal(true);
  };

  // Final booking submission inside the Review Modal
  const handleFinalConfirmBooking = async () => {
    setBookingError("");
    const digits = clientPhone.replace(/\D/g, "");

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
          clientAddress: clientAddress.trim(),
          clientNotes: clientNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShowReviewModal(false);
        setBookingError(
          data.error || "Não foi possível confirmar o agendamento."
        );
        fetchSlotsForDate(selectedDate);
        return;
      }

      setShowReviewModal(false);
      setBookingSuccess(data.appointment);
      fetchSlotsForDate(selectedDate);
    } catch (err) {
      console.error("Erro ao confirmar agendamento:", err);
      setShowReviewModal(false);
      setBookingError(
        "Erro de conexão ao confirmar agendamento. Tente novamente."
      );
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
    const rawPhone = (config?.whatsapp || "5577988350460").replace(/\D/g, "");
    const phone =
      !rawPhone || rawPhone === "11999999999" || rawPhone === "5511999999999"
        ? "5577988350460"
        : rawPhone;
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const fmtDate = appt.date.split("-").reverse().join("/");
    const addrLine = appt.clientAddress
      ? `\n📍 *Endereço (Domicílio):* ${appt.clientAddress}`
      : "";
    const msg = encodeURIComponent(
      `Olá ${config?.professionalName || ""}! ✨\nAcabei de agendar meu horário pelo site:\n\n💆‍♀️ *Procedimento:* ${appt.serviceName} (${formatBRL(appt.price)})\n📅 *Data:* ${fmtDate} às *${appt.time}*\n👩 *Cliente:* ${appt.clientName}${addrLine}`
    );
    return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${msg}`;
  };

  // Group slots into MANHÃ (< 12:30), TARDE (12:30 - 17:59), NOITE (>= 18:00)
  const morningSlots = slots.filter((s) => {
    const [h, m] = s.time.split(":").map(Number);
    return h * 60 + m <= 12 * 60;
  });
  const afternoonSlots = slots.filter((s) => {
    const [h, m] = s.time.split(":").map(Number);
    const mins = h * 60 + m;
    return mins > 12 * 60 && mins < 18 * 60;
  });
  const eveningSlots = slots.filter((s) => {
    const [h, m] = s.time.split(":").map(Number);
    return h * 60 + m >= 18 * 60;
  });

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // fallback to focus/click
      }
    }
    el.focus();
    el.click();
  };

  if (initialLoading) {
    return <AgendarSkeleton />;
  }

  return (
    <div
      key={enterKey}
      className={`${
        bookingSuccess
          ? "h-dvh overflow-hidden"
          : "min-h-screen pb-12"
      } bg-[#FAF8F5] text-[#111111] font-sans`}
    >
      <div
        className={`max-w-[440px] mx-auto ${
          bookingSuccess
            ? "h-dvh overflow-hidden flex flex-col"
            : "min-h-screen"
        } bg-[#FAF8F5] relative`}
      >
        {/* TOP STICKY HEADER + STEPPER BAR (Figma Node 1-214) */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EFECE6]/80 animate-card">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  resetBookingState();
                  router.push("/");
                }}
                aria-label="Voltar"
                className="w-8 h-8 -ml-1.5 rounded-full flex items-center justify-center text-[#111111] hover:bg-black/5 smooth-press cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              </button>

              <h1 className="text-[17px] font-bold tracking-tight text-[#111111]">
                Novo Agendamento
              </h1>
            </div>

            {/* Right Professional Avatar & Lookup trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Consultar meus horários"
                onClick={() => setShowLookupModal(true)}
                className="w-10 h-10 rounded-full overflow-hidden border border-[#E6DFD5] shadow-sm shrink-0 smooth-press cursor-pointer"
              >
                <img
                  src={config?.logoUrl || "/isa.png"}
                  alt={config?.professionalName || "Profissional"}
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>

          {/* STEPPER BAR: 1 Serviço --- 2 Data & Hora --- 3 Revisão */}
          {!bookingSuccess && (
            <div className="px-5 pb-3.5 pt-1 flex items-center justify-between gap-2 animate-card">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => setShowServicePicker(true)}
                className="flex items-center gap-1.5 shrink-0 group smooth-press cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[#EADCE0] text-[#574147] text-[11px] font-bold flex items-center justify-center transition-transform group-hover:scale-105">
                  1
                </span>
                <span className="text-[12px] font-medium text-[#78716C] group-hover:text-[#111111] transition-colors">
                  Serviço
                </span>
              </button>

              {/* Line 1 -> 2 */}
              <div className="h-[2px] flex-1 bg-[#111111] rounded-full mx-1" />

              {/* Step 2 (Active) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all duration-300 ${
                    showReviewModal
                      ? "bg-[#EADCE0] text-[#574147]"
                      : "bg-[#09090B] text-white"
                  }`}
                >
                  2
                </span>
                <span
                  className={`text-[12px] font-bold transition-colors ${
                    showReviewModal ? "text-[#78716C]" : "text-[#111111]"
                  }`}
                >
                  Data & Hora
                </span>
              </div>

              {/* Line 2 -> 3 */}
              <div
                className={`h-[1.5px] flex-1 rounded-full mx-1 transition-colors duration-300 ${
                  showReviewModal ? "bg-[#111111]" : "bg-[#E5E0D8]"
                }`}
              />

              {/* Step 3 */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all duration-300 ${
                    showReviewModal
                      ? "bg-[#09090B] text-white"
                      : "bg-[#EAE5DF] text-[#9CA3AF]"
                  }`}
                >
                  3
                </span>
                <span
                  className={`text-[12px] font-medium transition-colors ${
                    showReviewModal
                      ? "text-[#111111] font-bold"
                      : "text-[#9CA3AF]"
                  }`}
                >
                  Revisão
                </span>
              </div>
            </div>
          )}
        </header>

        <main
          className={`px-5 ${
            bookingSuccess
              ? "flex-1 flex flex-col justify-center pb-6 overflow-hidden"
              : "pt-2 space-y-6"
          }`}
        >
          {/* SUCCESS SCREEN IF BOOKING COMPLETED */}
          {bookingSuccess ? (
            <div className="p-6 rounded-[24px] bg-white border border-[#E5E0D8] space-y-5 text-center shadow-sm animate-modal">
              <div className="w-28 h-28 mx-auto flex items-center justify-center -my-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  role="img"
                  aria-label="Confirmação concluída"
                  className="w-28 h-28"
                >
                  <g transform="translate(256 256)">
                    <g>
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        dur="1s"
                        values="0 0; 1.1 1.1; 1 1; 1 1"
                        keyTimes="0; .2; .3; 1"
                        calcMode="spline"
                        keySplines=".2 0 .33 1; .2 0 .33 1; 0 0 1 1"
                        fill="freeze"
                      />
                      <circle r="150" fill="#22c55e" />
                    </g>

                    <g opacity="0">
                      <animate
                        attributeName="opacity"
                        begin=".233s"
                        dur=".4s"
                        values=".7; 0"
                        keyTimes="0; 1"
                        calcMode="spline"
                        keySplines=".2 0 .33 1"
                        fill="freeze"
                      />
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        begin=".233s"
                        dur=".4s"
                        values="1 1; 1.5 1.5"
                        keyTimes="0; 1"
                        calcMode="spline"
                        keySplines=".2 0 .33 1"
                        fill="freeze"
                      />
                      <circle
                        r="150"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="8"
                      />
                    </g>

                    <g>
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        dur="1s"
                        values="1 1; 1 1; 1.12 1.12; 1 1; 1 1"
                        keyTimes="0; .433; .533; .667; 1"
                        calcMode="spline"
                        keySplines="0 0 1 1; .2 0 .33 1; .2 0 .33 1; 0 0 1 1"
                        fill="freeze"
                      />
                      <path
                        d="M-72 4 L-22 54 L78 -50"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="30"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="240"
                        strokeDashoffset="240"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          begin=".2s"
                          dur=".3s"
                          from="240"
                          to="0"
                          calcMode="spline"
                          keySplines=".2 0 .33 1"
                          fill="freeze"
                        />
                      </path>
                    </g>
                  </g>
                </svg>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#10B981]">
                  Reserva Confirmada
                </span>
                <h2 className="text-xl font-extrabold text-[#111111]">
                  Tudo certo,{" "}
                  {bookingSuccess.clientName.trim().split(/\s+/)[0]}!
                </h2>
                <p className="text-xs text-[#78716C]">
                  Seu horário já está reservado na agenda de{" "}
                  {config?.professionalName}.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F1EC] text-left space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Procedimento:</span>
                  <span className="font-bold text-[#111111]">
                    {bookingSuccess.serviceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Valor:</span>
                  <span className="font-extrabold text-[#111111]">
                    {formatBRL(bookingSuccess.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Data e Horário:</span>
                  <span className="font-bold text-[#111111]">
                    {bookingSuccess.date.split("-").reverse().join("/")} às{" "}
                    {bookingSuccess.time}
                  </span>
                </div>
                {bookingSuccess.clientAddress && (
                  <div className="flex justify-between gap-3">
                    <span className="text-[#78716C] shrink-0">
                      Endereço (Domicílio):
                    </span>
                    <span className="font-bold text-[#111111] text-right">
                      {bookingSuccess.clientAddress}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <a
                  href={getWhatsAppConfirmationUrl(bookingSuccess)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-5 rounded-[18px] bg-[#09090B] hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md smooth-press"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                  </svg>
                  <span>Enviar Comprovante no WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    resetBookingState();
                  }}
                  className="w-full py-3.5 px-4 rounded-[18px] bg-[#F3EFEA] text-[#111111] text-xs font-bold hover:bg-[#EAE4DC] smooth-press cursor-pointer"
                >
                  Fazer Outro Agendamento
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOpenReviewModal} className="space-y-6">
              {/* CHOSEN PROCEDURE CARD (Blush Pink #EADCE0) */}
              <section
                className="space-y-2.5 animate-card"
                style={{ animationDelay: "30ms" }}
              >
                <div
                  onClick={() => setShowServicePicker(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setShowServicePicker(true);
                  }}
                  className="p-4 rounded-[22px] bg-[#EADCE0] flex items-center justify-between gap-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer smooth-card"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#D8C5CA] shrink-0 shadow-sm">
                      <img
                        src={
                          selectedService?.imageUrl ||
                          "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80"
                        }
                        alt={selectedService?.name || "Procedimento"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#7D6B70]">
                        PROCEDIMENTO ESCOLHIDO
                      </span>
                      <h2 className="text-[16px] font-extrabold text-[#111111] truncate leading-snug mt-0.5">
                        {selectedService?.name || "Clássico Fio a Fio"}
                      </h2>
                      <p className="text-[13px] font-semibold text-[#3F3A3C]">
                        {formatBRL(selectedService?.price ?? 190)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowServicePicker(true);
                    }}
                    aria-label="Trocar procedimento"
                    className="w-10 h-10 rounded-full bg-white text-[#111111] flex items-center justify-center shrink-0 shadow-sm smooth-press cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>
              </section>

              {/* SELECIONE O DIA SECTION */}
              <section
                className="space-y-3 animate-card"
                style={{ animationDelay: "70ms" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-[18px] h-[18px] text-[#111111] stroke-[2.2]" />
                    <h2 className="text-[16px] font-extrabold text-[#111111] tracking-tight">
                      Selecione o dia
                    </h2>
                  </div>
                  {selectedDate && (
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#78716C]">
                      {formatMonthYearUpper(selectedDate)}
                    </span>
                  )}
                </div>

                {/* Custom DatePicker Component (react-day-picker) */}
                <DatePicker
                  variant="banner"
                  title="Selecione o dia"
                  value={selectedDate}
                  minDate={todayMinDate}
                  label={
                    selectedDate
                      ? formatLongDateChip(selectedDate)
                      : "Escolher a data"
                  }
                  onChange={(d) => setSelectedDate(d)}
                />
              </section>

              {/* HORÁRIOS DISPONÍVEIS SECTION */}
              <section
                className="space-y-3 animate-card"
                style={{ animationDelay: "110ms" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-[18px] h-[18px] text-[#111111] stroke-[2.2]" />
                    <h2 className="text-[16px] font-extrabold text-[#111111] tracking-tight">
                      Horários disponíveis
                    </h2>
                  </div>
                  <span className="text-[12px] font-medium text-[#78716C]">
                    {selectedDate
                      ? formatShortSubtitleDate(selectedDate)
                      : "Escolha uma data"}
                  </span>
                </div>

                {!selectedDate ? (
                  <div className="p-6 rounded-[22px] bg-white text-center space-y-1 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                    <p className="text-xs font-bold text-[#111111]">
                      Nenhuma data selecionada
                    </p>
                    <p className="text-[11px] text-[#78716C]">
                      Clique em <b>Escolher a data</b> acima para ver os horários disponíveis.
                    </p>
                  </div>
                ) : loadingSlots ? (
                  <div className="p-4 rounded-[22px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3 animate-pulse">
                    <div className="h-2.5 w-16 rounded bg-[#E8E2D9]" />
                    <div className="grid grid-cols-4 gap-2.5">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-11 rounded-[14px] bg-[#F3EFEA]"
                        />
                      ))}
                    </div>
                  </div>
                ) : isFullDayBlocked ? (
                  <div className="p-5 rounded-[22px] bg-white border border-red-200 text-center space-y-1 animate-expand">
                    <p className="text-xs font-bold text-red-600">
                      {blockReason || "Agenda fechada nesta data"}
                    </p>
                    <p className="text-[11px] text-[#78716C]">
                      Toque na data acima para escolher outro dia.
                    </p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-5 rounded-[22px] bg-white text-center animate-expand">
                    <p className="text-xs text-[#78716C]">
                      Nenhum horário cadastrado para este dia.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-[22px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] smooth-card animate-expand">
                    <div className="grid grid-cols-4 gap-2.5">
                      {slots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-3 px-2 rounded-[14px] text-[13px] font-bold smooth-press flex items-center justify-center ${
                              !slot.available
                                ? "bg-[#F7F5F2] text-[#C8C3BC] line-through cursor-not-allowed"
                                : isSelected
                                ? "bg-[#09090B] text-white shadow-sm"
                                : "bg-[#F3EFEA] hover:bg-[#E9E4DD] text-[#111111] cursor-pointer"
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* SEUS DADOS PARA CONFIRMAÇÃO SECTION */}
              <section
                className="space-y-3 animate-card"
                style={{ animationDelay: "150ms" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-[18px] h-[18px] text-[#111111] stroke-[2.2]" />
                    <h2 className="text-[16px] font-extrabold text-[#111111] tracking-tight">
                      Seus dados para confirmação
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLookupModal(true)}
                    className="text-[11px] font-bold text-[#78716C] hover:text-[#111111] underline cursor-pointer"
                  >
                    Meus horários
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* NOME COMPLETO */}
                  <div className="px-4 py-3.5 rounded-[20px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] smooth-card">
                    <label
                      htmlFor="input-client-name"
                      className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C] mb-1.5"
                    >
                      NOME COMPLETO
                    </label>
                    <div className="flex items-center gap-2.5">
                      <IdCard className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                      <input
                        id="input-client-name"
                        type="text"
                        required
                        autoComplete="off"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Mariana Silveira"
                        className="w-full bg-transparent text-[14px] font-medium text-[#111111] placeholder:text-[#C0B9B0] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* WHATSAPP PARA LEMBRETE */}
                  <div className="px-4 py-3.5 rounded-[20px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] smooth-card">
                    <label
                      htmlFor="input-client-phone"
                      className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C] mb-1.5"
                    >
                      WHATSAPP PARA LEMBRETE
                    </label>
                    <div className="flex items-center gap-2.5">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 text-[#9CA3AF] shrink-0"
                      >
                        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                      </svg>
                      <input
                        id="input-client-phone"
                        type="tel"
                        inputMode="numeric"
                        required
                        autoComplete="off"
                        value={clientPhone}
                        onChange={(e) =>
                          setClientPhone(formatPhoneMask(e.target.value))
                        }
                        placeholder="(11) 98765-4321"
                        className="w-full bg-transparent text-[14px] font-medium text-[#111111] placeholder:text-[#C0B9B0] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* ENDEREÇO PARA ATENDIMENTO A DOMICÍLIO (Geoapify Autocomplete + Número) */}
                  <div className="space-y-2.5">
                    <div className="px-4 py-3.5 rounded-[20px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] smooth-card relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="input-client-address"
                          className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]"
                        >
                          RUA / ENDEREÇO (BUSCA NO MAPA)
                        </label>
                        {addressVerifiedBase ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#10B981]">
                            <Check className="w-3 h-3 stroke-[2.8]" />
                            <span>Localizado no Maps</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#A8A29E]">
                            Selecione na lista
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <MapPin
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            addressVerifiedBase
                              ? "text-[#10B981]"
                              : "text-[#9CA3AF]"
                          }`}
                        />
                        <input
                          id="input-client-address"
                          type="text"
                          required
                          autoComplete="off"
                          value={addressStreetQuery}
                          onFocus={() => setShowGeoDropdown(true)}
                          onBlur={() => {
                            setTimeout(() => setShowGeoDropdown(false), 180);
                          }}
                          onChange={(e) => {
                            setAddressStreetQuery(e.target.value);
                            setAddressVerifiedBase(null);
                            setShowGeoDropdown(true);
                          }}
                          placeholder="Digite sua rua, avenida ou CEP..."
                          className="w-full bg-transparent text-[14px] font-medium text-[#111111] placeholder:text-[#C0B9B0] focus:outline-none"
                        />
                        {loadingGeo && (
                          <Loader2 className="w-4 h-4 text-[#78716C] animate-spin shrink-0" />
                        )}
                        {addressStreetQuery && !loadingGeo && (
                          <button
                            type="button"
                            aria-label="Limpar endereço"
                            onClick={() => {
                              setAddressStreetQuery("");
                              setAddressVerifiedBase(null);
                              setGeoSuggestions([]);
                            }}
                            className="w-5 h-5 rounded-full bg-[#F4F1EC] hover:bg-[#E5E0D8] flex items-center justify-center text-[#78716C] shrink-0 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {addressVerifiedBase && (
                        <p className="text-[11px] font-medium text-[#78716C] mt-1.5 pl-6 truncate">
                          {[
                            addressVerifiedBase.suburb,
                            addressVerifiedBase.city &&
                            addressVerifiedBase.state
                              ? `${addressVerifiedBase.city} - ${addressVerifiedBase.state}`
                              : addressVerifiedBase.city,
                            addressVerifiedBase.postcode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}

                      {/* Dropdown de sugestões Geoapify */}
                      {showGeoDropdown &&
                        !addressVerifiedBase &&
                        (geoSuggestions.length > 0 ||
                          (addressStreetQuery.trim().length >= 3 &&
                            !loadingGeo)) && (
                          <ScrollArea
                            maxHeightClass="max-h-56"
                            className="mt-2.5 pt-2 border-t border-[#EFECE6] space-y-1"
                          >
                            {geoSuggestions.length === 0 ? (
                              <p className="text-[11px] text-[#78716C] py-2 px-1">
                                Nenhum endereço encontrado. Tente digitar o nome
                                da rua com a cidade ou CEP.
                              </p>
                            ) : (
                              geoSuggestions.map((item) => (
                                <button
                                  key={item.placeId}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setAddressStreetQuery(
                                      item.street || item.line1
                                    );
                                    if (
                                      item.housenumber &&
                                      !addressNumber.trim()
                                    ) {
                                      setAddressNumber(item.housenumber);
                                    }
                                    setAddressVerifiedBase({
                                      street: item.street || item.line1,
                                      suburb: item.suburb,
                                      city: item.city,
                                      state: item.state,
                                      postcode: item.postcode,
                                      formatted: item.formatted,
                                    });
                                    setShowGeoDropdown(false);
                                  }}
                                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFEA] text-left flex items-start gap-2.5 transition cursor-pointer"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-[#111111] shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-extrabold text-[#111111] truncate">
                                      {item.line1}
                                    </p>
                                    {item.line2 && (
                                      <p className="text-[11px] font-medium text-[#78716C] truncate">
                                        {item.line2}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              ))
                            )}
                          </ScrollArea>
                        )}
                    </div>

                    {/* NÚMERO E COMPLEMENTO */}
                    <div className="grid grid-cols-5 gap-2.5">
                      <div className="col-span-2 px-4 py-3.5 rounded-[20px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] smooth-card">
                        <label
                          htmlFor="input-client-address-number"
                          className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C] mb-1.5"
                        >
                          NÚMERO *
                        </label>
                        <input
                          id="input-client-address-number"
                          type="text"
                          required
                          autoComplete="off"
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                          placeholder="Ex: 120"
                          className="w-full bg-transparent text-[14px] font-medium text-[#111111] placeholder:text-[#C0B9B0] focus:outline-none"
                        />
                      </div>

                      <div className="col-span-3 px-4 py-3.5 rounded-[20px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] smooth-card">
                        <label
                          htmlFor="input-client-address-comp"
                          className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C] mb-1.5"
                        >
                          COMPLEMENTO (OPCIONAL)
                        </label>
                        <input
                          id="input-client-address-comp"
                          type="text"
                          autoComplete="off"
                          value={addressComplement}
                          onChange={(e) => setAddressComplement(e.target.value)}
                          placeholder="Casa, Apto, Referência..."
                          className="w-full bg-transparent text-[14px] font-medium text-[#111111] placeholder:text-[#C0B9B0] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OBSERVAÇÕES OU ALERGIAS (OPCIONAL) */}
                  <div className="px-4 py-3.5 rounded-[20px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] smooth-card">
                    <label
                      htmlFor="input-client-notes"
                      className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C] mb-1.5"
                    >
                      OBSERVAÇÕES OU ALERGIAS (OPCIONAL)
                    </label>
                    <div className="flex items-start gap-2.5">
                      <PenLine className="w-4 h-4 text-[#9CA3AF] shrink-0 mt-0.5" />
                      <textarea
                        id="input-client-notes"
                        rows={2}
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        placeholder="Ex: Primeira vez fazendo extensão, sensibilidade leve a colas..."
                        className="w-full bg-transparent text-[13px] font-medium text-[#111111] placeholder:text-[#C0B9B0] focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {bookingError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-semibold animate-expand">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* BOTTOM CTA BAR (Figma Node 1-214) */}
              <div
                className="pt-1 pb-4 animate-card"
                style={{ animationDelay: "190ms" }}
              >
                <button
                  type="submit"
                  disabled={submittingBooking || loadingSlots}
                  className={`w-full py-4 px-5 rounded-[20px] text-white flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] smooth-press disabled:opacity-60 cursor-pointer ${
                    isFormReady
                      ? "bg-[#10B981] hover:bg-[#059669] shadow-[0_10px_24px_rgba(16,185,129,0.28)]"
                      : "bg-[#09090B] hover:bg-zinc-800 shadow-[0_10px_24px_rgba(0,0,0,0.14)]"
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-[14px] font-bold">
                    <CalendarCheck className="w-5 h-5 text-white stroke-[2]" />
                    <span>Confirmar Agendamento</span>
                  </span>

                  <span className="flex items-center gap-1.5 text-[16px] font-extrabold">
                    <span>
                      {formatBRLShort(selectedService?.price ?? 190)}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </span>
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* ==================== MODAL: TROCAR PROCEDIMENTO ==================== */}
      <AnimatedModal
        open={showServicePicker}
        onClose={() => setShowServicePicker(false)}
        roundedClass="rounded-[32px]"
        cardClassName={
          services.length >= 8 ? "h-[90vh] max-h-[90vh] flex flex-col" : ""
        }
      >
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-[17px] font-extrabold text-[#111111]">
                  Escolher Procedimento
                </h3>
                <p className="text-xs text-[#78716C]">
                  Selecione o procedimento desejado
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setShowServicePicker(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ScrollArea
              className={
                services.length >= 8
                  ? "space-y-2 flex-1 min-h-0"
                  : "space-y-2 max-h-72"
              }
            >
              {services.map((srv) => {
                const isCurrent =
                  String(srv.id) === String(selectedServiceId);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      const nextId = String(srv.id);
                      setShowServicePicker(false);
                      requestAnimationFrame(() => {
                        setSelectedServiceId(nextId);
                      });
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left smooth-press cursor-pointer ${
                      isCurrent
                        ? "bg-[#09090B] text-white shadow-sm"
                        : "bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#111111]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {srv.imageUrl ? (
                        <img
                          src={srv.imageUrl}
                          alt={srv.name}
                          className="w-11 h-11 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#EADCE0] flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-[#111111]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">
                          {srv.name}
                        </p>
                        <p
                          className={`text-[11px] ${
                            isCurrent ? "text-zinc-300" : "text-[#78716C]"
                          }`}
                        >
                          {srv.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold shrink-0 ml-2">
                      {formatBRL(srv.price)}
                    </span>
                  </button>
                );
              })}
            </ScrollArea>

            <button
              type="button"
              onClick={() => {
                setShowServicePicker(false);
                router.push("/catalogo");
              }}
              className="w-full py-3 rounded-2xl bg-[#F3EFEA] hover:bg-[#E7E2DA] text-[#111111] text-xs font-bold smooth-press cursor-pointer shrink-0"
            >
              Ver fotos e detalhes no catálogo completo
            </button>
      </AnimatedModal>

      {/* ==================== MODAL: CONFERIR AGENDAMENTO (Figma Node 1-2) ==================== */}
      <AnimatedModal
        open={Boolean(showReviewModal && selectedService)}
        onClose={() => setShowReviewModal(false)}
        roundedClass="rounded-[32px]"
      >
        {selectedService && (
          <>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#EADCE0] flex items-center justify-center shrink-0">
                  <ListChecks className="w-5 h-5 text-[#111111] stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#111111] leading-snug">
                    Conferir Agendamento
                  </h3>
                  <p className="text-[12px] text-[#78716C] leading-snug mt-0.5">
                    Revise os dados antes de
                    <br />
                    finalizar
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Summary Cream Box (#F4F1EC) */}
            <div className="p-5 rounded-[22px] bg-[#F4F1EC] border border-[#E8E2D9] space-y-4">
              {/* Top Row: Procedimento & Price */}
              <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#E5DFD5]">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                    PROCEDIMENTO
                  </span>
                  <h4 className="text-[16px] font-extrabold text-[#111111] mt-0.5">
                    {selectedService.name}
                  </h4>
                </div>
                <span className="text-[17px] font-extrabold text-[#111111] shrink-0">
                  {formatBRL(selectedService.price)}
                </span>
              </div>

              {/* Details Rows */}
              <div className="space-y-3.5">
                {/* DATA & HORÁRIO */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#111111] shrink-0 stroke-[2]" />
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                      DATA & HORÁRIO
                    </span>
                    <p className="text-[13px] font-semibold text-[#111111]">
                      {formatModalDateAndTime(selectedDate, selectedTime)}
                    </p>
                  </div>
                </div>

                {/* CLIENTE */}
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-[#111111] shrink-0 stroke-[2]" />
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                      CLIENTE
                    </span>
                    <p className="text-[13px] font-semibold text-[#111111]">
                      {clientName.trim()} • {formatPhoneMask(clientPhone)}
                    </p>
                  </div>
                </div>

                {/* ENDEREÇO (ATENDIMENTO A DOMICÍLIO) */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#111111] shrink-0 stroke-[2] mt-0.5" />
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-[#78716C]">
                      ENDEREÇO (A DOMICÍLIO)
                    </span>
                    <p className="text-[13px] font-semibold text-[#111111] leading-snug">
                      {clientAddress.trim()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                disabled={submittingBooking}
                onClick={handleFinalConfirmBooking}
                className="w-full py-4 px-5 rounded-[18px] bg-[#09090B] hover:bg-zinc-800 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md smooth-press disabled:opacity-60 cursor-pointer"
              >
                {submittingBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirmar e Agendar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={submittingBooking}
                onClick={() => setShowReviewModal(false)}
                className="w-full py-2 text-center text-[13px] font-semibold text-[#57534E] hover:text-[#111111] smooth-press cursor-pointer"
              >
                Voltar e editar dados
              </button>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* ==================== MODAL: CONSULTAR / DESMARCAR HORÁRIOS ==================== */}
      <AnimatedModal
        open={showLookupModal}
        onClose={() => {
          setShowLookupModal(false);
          setLookupResults(null);
          setLookupError("");
        }}
        roundedClass="rounded-[32px]"
      >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#111111]">
                Consultar Meus Agendamentos
              </h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => {
                  setShowLookupModal(false);
                  setLookupResults(null);
                  setLookupError("");
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLookupAppointments} className="space-y-3">
              <p className="text-xs text-[#78716C]">
                Informe o número de WhatsApp com DDD usado no seu agendamento:
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={lookupPhone}
                  onChange={(e) =>
                    setLookupPhone(formatPhoneMask(e.target.value))
                  }
                  placeholder="(11) 98765-4321"
                  className="flex-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3.5 py-3 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="submit"
                  disabled={loadingLookup}
                  className="px-4 py-3 rounded-xl bg-[#09090B] text-white font-bold text-xs flex items-center gap-1.5 smooth-press cursor-pointer"
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
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl animate-expand">
                {lookupError}
              </p>
            )}

            {lookupResults !== null && (
              <ScrollArea maxHeightClass="max-h-72" className="space-y-2.5 pt-1">
                {lookupResults.length === 0 ? (
                  <p className="text-xs text-[#78716C] text-center py-4">
                    Nenhum agendamento ativo encontrado para este WhatsApp.
                  </p>
                ) : (
                  lookupResults.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2.5 animate-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-[#111111]">
                            {item.serviceName}
                          </p>
                          <p className="text-xs text-[#78716C]">
                            {item.date.split("-").reverse().join("/")} às{" "}
                            <b className="text-[#111111]">{item.time}</b>
                          </p>
                        </div>
                        <span className="text-sm font-extrabold text-[#111111]">
                          {formatBRL(item.price)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={cancelingId === item.id}
                        onClick={() => setConfirmCancelClientAppt(item)}
                        className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm smooth-press cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 stroke-[2.2]" />
                        <span>Desmarcar horário</span>
                      </button>
                    </div>
                  ))
                )}
              </ScrollArea>
            )}
      </AnimatedModal>

      {/* ==================== MODAL: CONFIRMAR DESMARCAÇÃO PELA CLIENTE ==================== */}
      <AnimatedModal
        open={Boolean(confirmCancelClientAppt)}
        onClose={() => setConfirmCancelClientAppt(null)}
        roundedClass="rounded-[32px]"
      >
        {confirmCancelClientAppt && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#111111] leading-snug">
                    Desmarcar Horário
                  </h3>
                  <p className="text-[12px] text-[#78716C] leading-snug mt-0.5">
                    Confirme os dados antes de
                    <br />
                    desmarcar seu agendamento
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmCancelClientAppt(null)}
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
                    {confirmCancelClientAppt.serviceName}
                  </h4>
                </div>
                <span className="text-[17px] font-extrabold text-[#111111] shrink-0">
                  {formatBRL(confirmCancelClientAppt.price)}
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
                      {formatModalDateAndTime(
                        confirmCancelClientAppt.date,
                        confirmCancelClientAppt.time
                      )}
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
                      {confirmCancelClientAppt.clientName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                disabled={cancelingId === confirmCancelClientAppt.id}
                onClick={async () => {
                  await handleCancelAppointment(confirmCancelClientAppt.id);
                  setConfirmCancelClientAppt(null);
                }}
                className="w-full py-4 px-5 rounded-[18px] bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md smooth-press disabled:opacity-60 cursor-pointer"
              >
                {cancelingId === confirmCancelClientAppt.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Desmarcando...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirmar e Desmarcar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setConfirmCancelClientAppt(null)}
                className="w-full py-2 text-center text-[13px] font-semibold text-[#57534E] hover:text-[#111111] smooth-press cursor-pointer"
              >
                Voltar sem desmarcar
              </button>
            </div>
          </>
        )}
      </AnimatedModal>
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={<AgendarSkeleton />}>
      <AgendarContent />
    </Suspense>
  );
}
