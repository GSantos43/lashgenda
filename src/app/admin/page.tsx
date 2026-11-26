"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Settings,
  SlidersHorizontal,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Edit3,
  BookOpen,
  X,
  XCircle,
  AlertTriangle,
  User,
} from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { AnimatedModal } from "@/components/AnimatedModal";

interface AdminConfig {
  id: number;
  studioName: string;
  professionalName: string;
  tagline: string;
  bio: string;
  address: string;
  whatsapp: string;
  instagram: string;
  logoUrl: string;
  coverUrl: string;
  badges: string[];
  themeMode: string;
  minAdvanceHours: number;
  availableSlots: string[];
  portfolio: string[];
  whatsappMessageTemplate: string;
  adminUsername: string;
  adminPassword?: string;
}

interface LinkItem {
  id?: number;
  title: string;
  subtitle: string;
  url: string;
  icon: string;
  highlight: boolean;
  active: boolean;
  order: number;
}

interface ServiceItem {
  id?: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  imageUrl: string;
  featured: boolean;
  active: boolean;
  order: number;
}

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

interface ScheduleBlockItem {
  id: number;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  reason: string;
}

interface BlockedClientItem {
  id: number;
  phone: string;
  name: string;
  reason: string;
}

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

const WEEKDAYS_SHORT_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function getTodayStr(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseDateParts(dateStr: string) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { day: 24, monthIndex: 9, year: 2024, weekdayIndex: 2 };
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

function formatExecutiveTitleDate(dateStr: string): string {
  const { day, monthIndex, weekdayIndex } = parseDateParts(dateStr);
  return `${WEEKDAYS_SHORT_PT[weekdayIndex]}, ${day} de ${MONTHS_PT[monthIndex]}`;
}

function formatDatePillLabel(dateStr: string, todayStr: string): string {
  const { day, monthIndex } = parseDateParts(dateStr);
  const isToday = dateStr === todayStr;
  return `${day} ${MONTHS_SHORT_PT[monthIndex]}${isToday ? ", Hoje" : ""}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [enterKey, setEnterKey] = useState(0);

  useEffect(() => {
    setEnterKey((k) => k + 1);
  }, [pathname]);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginAnimStage, setLoginAnimStage] = useState<
    "idle" | "fading-form" | "welcome" | "exiting"
  >("idle");
  const [tickAnimKey, setTickAnimKey] = useState(0);

  // Bottom Navigation Tab (Início, Catálogo, Agenda, Configurações)
  const [bottomTab, setBottomTab] = useState<
    "inicio" | "catalogo" | "agenda" | "configuracoes"
  >("inicio");

  // Sub-tab inside Configurações
  const [configSubTab, setConfigSubTab] = useState<
    "linktree" | "financeiro" | "clientes"
  >("linktree");

  // Sub-tab inside Agenda ("agenda" | "configuracoes") and selected month (YYYY-MM)
  const [agendaSubTab, setAgendaSubTab] = useState<"agenda" | "configuracoes">(
    "agenda"
  );
  const [agendaMonthYear, setAgendaMonthYear] = useState<string>("");
  const [onlyScheduledDays, setOnlyScheduledDays] = useState<boolean>(false);

  // Data states
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlockItem[]>([]);
  const [blockedClients, setBlockedClients] = useState<BlockedClientItem[]>([]);
  const [whatsappEvents, setWhatsappEvents] = useState<WhatsappEventItem[]>([]);

  // Action loading & toast feedback
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals & selected item drawer
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);
  const [confirmCancelAppointment, setConfirmCancelAppointment] =
    useState<AppointmentItem | null>(null);

  // Agenda Filter
  const [todayStr, setTodayStr] = useState<string>("");
  const [agendaDate, setAgendaDate] = useState<string>("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualAppt, setManualAppt] = useState({
    serviceId: "",
    date: "",
    time: "09:30",
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    clientNotes: "",
  });

  // Service Form Modal State
  const [editingService, setEditingService] = useState<ServiceItem | null>(
    null
  );

  // Linktree Button Form Modal State
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // New slot & block inputs
  const [newSlotTime, setNewSlotTime] = useState("11:00");
  const [newBlock, setNewBlock] = useState({
    date: "",
    type: "dia",
    startTime: "12:00",
    endTime: "14:00",
    reason: "Folga / Horário de Almoço",
  });

  // New blocked client input
  const [newBlockedPhone, setNewBlockedPhone] = useState("");
  const [newBlockedName, setNewBlockedName] = useState("");

  // Financeiro week reference
  const [financeWeekDate, setFinanceWeekDate] = useState<string>("");
  const [showValueCards, setShowValueCards] = useState(true);
  const [homeDisplayMode, setHomeDisplayMode] = useState<"clientes" | "tudo">(
    "tudo"
  );

  // Pull-to-refresh state (Direct DOM manipulation for 60fps zero-lag dragging)
  const [isRefreshingPull, setIsRefreshingPull] = useState(false);
  const pullContainerRef = useRef<HTMLDivElement | null>(null);
  const pullSpacerRef = useRef<HTMLDivElement | null>(null);
  const pullCircleRef = useRef<HTMLDivElement | null>(null);
  const pullIconRef = useRef<SVGSVGElement | null>(null);
  const pullStartYRef = useRef<number | null>(null);
  const pullOffsetRef = useRef<number>(0);
  const isRefreshingPullRef = useRef<boolean>(false);
  const PULL_THRESHOLD = 84; // px needed so the refresh icon transitions smoothly from white to full black

  const applyPullVisuals = (offset: number, animateTransition: boolean) => {
    const spacer = pullSpacerRef.current;
    const circle = pullCircleRef.current;
    const icon = pullIconRef.current;
    if (!spacer || !circle || !icon) return;

    const refreshing = isRefreshingPullRef.current;
    const rawRatio = refreshing
      ? 1
      : Math.min(1, Math.max(0, offset / PULL_THRESHOLD));

    // Stay white while emerging from behind the header (first 48% of pull),
    // then use a quadratic ease-in (t^2.2) so it stays nearly white until well below the header
    // and smoothly accelerates into black right at the reload threshold (100%).
    const normalizedColorRatio = refreshing
      ? 1
      : Math.min(1, Math.max(0, (rawRatio - 0.48) / 0.52));
    const colorProgress = Math.pow(normalizedColorRatio, 2.2);

    const isReadyToReload = rawRatio >= 1 || refreshing;

    // Interpolate background from pure white (255, 255, 255) to black (#141519 -> 20, 21, 25)
    const bgR = Math.round(255 - (255 - 20) * colorProgress);
    const bgG = Math.round(255 - (255 - 21) * colorProgress);
    const bgB = Math.round(255 - (255 - 25) * colorProgress);

    // Interpolate border from #E5E0D8 (229, 224, 216) to #141519 (20, 21, 25)
    const bdR = Math.round(229 - (229 - 20) * colorProgress);
    const bdG = Math.round(224 - (224 - 21) * colorProgress);
    const bdB = Math.round(216 - (216 - 25) * colorProgress);

    // Interpolate icon color from dark charcoal (45, 43, 42) when background is white -> to pure white (255, 255, 255) as background turns black
    const fgR = Math.round(45 + (255 - 45) * colorProgress);
    const fgG = Math.round(43 + (255 - 43) * colorProgress);
    const fgB = Math.round(42 + (255 - 42) * colorProgress);

    spacer.style.transition = animateTransition
      ? "height 300ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none";
    spacer.style.height = `${offset}px`;

    circle.style.transition = animateTransition
      ? "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, background-color 220ms ease, border-color 220ms ease, color 220ms ease"
      : "none";
    circle.style.opacity = String(Math.min(1, offset / 24));
    circle.style.backgroundColor = `rgb(${bgR}, ${bgG}, ${bgB})`;
    circle.style.borderColor = `rgb(${bdR}, ${bdG}, ${bdB})`;
    circle.style.color = refreshing
      ? "#10B981"
      : `rgb(${fgR}, ${fgG}, ${fgB})`;

    const translateY = Math.min(0, (offset - PULL_THRESHOLD) * 0.45);
    const scale = isReadyToReload
      ? 1.05
      : Math.min(1, 0.78 + rawRatio * 0.22);
    circle.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;

    if (!refreshing) {
      icon.style.transition = animateTransition
        ? "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "none";
      icon.style.transform = `rotate(${Math.round(offset * 3.2)}deg)`;
    } else {
      icon.style.transition = "none";
      icon.style.transform = "";
    }
  };

  useEffect(() => {
    if (bottomTab !== "inicio") {
      pullOffsetRef.current = 0;
      applyPullVisuals(0, false);
      return;
    }

    const el = pullContainerRef.current;
    if (!el) return;

    let activeTouch = false;

    const onStart = (clientY: number, target: EventTarget | null) => {
      if (isRefreshingPullRef.current) return;
      if (window.scrollY > 5) return;
      if (
        target instanceof HTMLElement &&
        target.closest("button, a, input, select, textarea")
      ) {
        return;
      }
      pullStartYRef.current = clientY;
      activeTouch = true;
    };

    const onMove = (clientY: number, e?: TouchEvent | MouseEvent) => {
      if (!activeTouch || pullStartYRef.current === null || isRefreshingPullRef.current)
        return;
      if (window.scrollY > 5) {
        activeTouch = false;
        pullStartYRef.current = null;
        if (pullOffsetRef.current > 0) {
          pullOffsetRef.current = 0;
          applyPullVisuals(0, true);
        }
        return;
      }
      const delta = clientY - pullStartYRef.current;
      if (delta <= 0) {
        if (pullOffsetRef.current > 0) {
          pullOffsetRef.current = 0;
          applyPullVisuals(0, false);
        }
        return;
      }
      if (e && e.cancelable) {
        e.preventDefault();
      }
      const damped = Math.min(116, Math.pow(delta, 0.85) * 1.15);
      pullOffsetRef.current = damped;
      applyPullVisuals(damped, false);
    };

    const onEnd = async () => {
      if (!activeTouch || pullStartYRef.current === null) return;
      activeTouch = false;
      pullStartYRef.current = null;
      const currentPull = pullOffsetRef.current;

      if (currentPull >= PULL_THRESHOLD && !isRefreshingPullRef.current) {
        isRefreshingPullRef.current = true;
        setIsRefreshingPull(true);
        pullOffsetRef.current = PULL_THRESHOLD;
        applyPullVisuals(PULL_THRESHOLD, true);
        await loadAdminData();
        showToast("Agenda e informações atualizadas!");
        isRefreshingPullRef.current = false;
        setIsRefreshingPull(false);
        pullOffsetRef.current = 0;
        applyPullVisuals(0, true);
      } else {
        pullOffsetRef.current = 0;
        applyPullVisuals(0, true);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientY, e.target);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientY, e);
      }
    };
    const handleTouchEnd = () => {
      onEnd();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        onStart(e.clientY, e.target);
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      onMove(e.clientY, e);
    };
    const handleMouseUp = () => {
      onEnd();
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [authenticated, enterKey, bottomTab]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const readImageFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Falha ao ler imagem"));
      reader.onload = () => {
        const rawDataUrl = String(reader.result || "");
        const img = new Image();
        img.onerror = () => resolve(rawDataUrl);
        img.onload = () => {
          const maxDim = 900;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });

  const loadAdminData = async (deferAuthSwitch = false) => {
    try {
      const res = await fetch("/api/admin", { cache: "no-store" });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.authenticated) {
        if (!deferAuthSwitch) {
          setAuthenticated(true);
        }
        setConfig(data.config);
        setLinks(data.links || []);
        setServices(data.services || []);
        setAppointments(data.appointments || []);
        setBlocks(data.blocks || []);
        setBlockedClients(data.blockedClients || []);
        setWhatsappEvents(data.whatsappEvents || []);
        if (data.services?.length > 0 && !manualAppt.serviceId) {
          setManualAppt((prev) => ({
            ...prev,
            serviceId: String(data.services[0].id),
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar admin:", err);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    const today = getTodayStr();
    setTodayStr(today);
    setAgendaDate(today);
    setAgendaMonthYear(today.slice(0, 7));
    setFinanceWeekDate(today);
    setManualAppt((prev) => ({ ...prev, date: today }));
    setNewBlock((prev) => ({ ...prev, date: today }));
    try {
      const savedFilter = localStorage.getItem("lash_agenda_only_scheduled");
      if (savedFilter === "true") {
        setOnlyScheduledDays(true);
      }
      const savedHomeMode = localStorage.getItem("lash_home_display_mode");
      if (savedHomeMode === "clientes" || savedHomeMode === "tudo") {
        setHomeDisplayMode(savedHomeMode);
      }
    } catch {
      // ignore localStorage read errors
    }
    loadAdminData();
  }, []);

  const toggleOnlyScheduledDays = () => {
    setOnlyScheduledDays((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("lash_agenda_only_scheduled", String(next));
      } catch {
        // ignore localStorage write errors
      }
      return next;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      setLoginLoading(true);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Credenciais inválidas.");
        setLoginLoading(false);
        return;
      }

      // Start loading dashboard data in parallel while running the card transition
      const dataPromise = loadAdminData(true);

      // Step 1: Fade out the login form in 0.3s (300ms) inside the exact same card
      setLoginLoading(false);
      setLoginAnimStage("fading-form");

      setTimeout(() => {
        // Step 2: Fade in welcome message & trigger SVG draw animation
        setTickAnimKey((k) => k + 1);
        setLoginAnimStage("welcome");

        setTimeout(() => {
          // Step 3: Card slides up and fades out
          setLoginAnimStage("exiting");

          setTimeout(async () => {
            await dataPromise;
            setBottomTab("inicio");
            setEnterKey((k) => k + 1);
            setAuthenticated(true);
            setLoginAnimStage("idle");
          }, 540);
        }, 1250);
      }, 300);
    } catch (err) {
      console.error(err);
      setLoginError("Erro ao conectar ao servidor.");
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    setBusyAction("logout");
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setBottomTab("inicio");
    setPassword("");
    setAuthenticated(false);
    setBusyAction(null);
  };

  const runAdminAction = async (
    actionKey: string,
    payload: Record<string, unknown>,
    onSuccess?: () => void
  ) => {
    try {
      setBusyAction(actionKey);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao executar operação.");
        return;
      }
      await loadAdminData();
      if (data.message) showToast(data.message);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação com o servidor.");
    } finally {
      setBusyAction(null);
    }
  };

  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

  const formatBRLCompact = (v: number) => {
    const num = Number(v || 0);
    if (Number.isInteger(num)) {
      return `R$ ${num}`;
    }
    return formatBRL(num);
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

  const copyPublicLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast("Link da Bio copiado!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const resolveNotificationAppointmentId = (
    ev: WhatsappEventItem
  ): number | null => {
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

  const handleOpenNotificationItem = (ev: WhatsappEventItem) => {
    if (!ev.read) {
      setWhatsappEvents((prev) =>
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

    const apptId = resolveNotificationAppointmentId(ev);
    if (apptId) {
      setShowNotificationsModal(false);
      router.push(`/atendimento/${apptId}`);
    }
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // fallback
      }
    }
    el.focus();
    el.click();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-[#111111] animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#78716C]">
          Carregando Painel Executivo...
        </p>
      </div>
    );
  }

  // LOGIN SCREEN (Clean Cream & Black Figma style with smooth animation)
  if (!authenticated) {
    const isFormHidden = loginAnimStage !== "idle";
    const isWelcomeVisible =
      loginAnimStage === "welcome" || loginAnimStage === "exiting";
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col items-center justify-center p-5 font-sans overflow-hidden">
        <div
          className={`w-full max-w-[380px] bg-white border border-[#E5E0D8] rounded-[28px] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.06)] relative ${
            loginAnimStage === "exiting"
              ? "animate-login-card-exit pointer-events-none"
              : "animate-modal"
          }`}
        >
          {/* Login Form Content (stays in flow to keep the exact same card height, fades out in 0.3s) */}
          <div
            aria-hidden={isFormHidden}
            className={`space-y-6 transition-opacity duration-300 ease-out ${
              isFormHidden
                ? "opacity-0 pointer-events-none select-none"
                : "opacity-100"
            }`}
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#111111]" />
              </div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C]">
                PAINEL EXECUTIVO
              </span>
              <h1 className="text-xl font-extrabold text-[#111111]">
                Isabele Lash Designer
              </h1>
              <p className="text-xs text-[#78716C]">
                Entre com seu usuário e senha para acessar a agenda executiva e
                configurações.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                  Usuário
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl px-4 py-3 text-sm font-medium text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl px-4 py-3 text-sm font-medium text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl text-center font-semibold animate-expand">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading || isFormHidden}
                className="w-full py-4 rounded-[18px] bg-[#0F1115] hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md smooth-press cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar no Painel</span>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-[#F0ECE6] text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs font-bold text-[#111111] hover:underline cursor-pointer"
              >
                ← Voltar para a Página da Cliente
              </button>
            </div>
          </div>

          {/* Welcome Content inside the exact same card (fades in after 0.3s form fade-out & triggers SVG animation) */}
          {isWelcomeVisible && (
            <div
              key={tickAnimKey}
              className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-[backdropFadeIn_300ms_ease-out_forwards]"
            >
              <img
                src={`/tick-sucess.svg?v=${tickAnimKey}`}
                alt="Sucesso"
                className="w-16 h-16 mx-auto"
              />
              <h2 className="text-xl font-extrabold text-[#111111] tracking-tight">
                Bem vindo, Isabele!
              </h2>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Filter appointments for selected agendaDate
  const dailyAppointments = appointments
    .filter((a) => a.date === agendaDate && a.status !== "cancelado")
    .sort((a, b) => a.time.localeCompare(b.time));

  const completedToday = dailyAppointments.filter(
    (a) => a.status === "concluido"
  );
  const remainingToday = dailyAppointments.filter(
    (a) => a.status === "agendado"
  );

  const receivedAmountToday = completedToday.reduce(
    (acc, cur) => acc + cur.price,
    0
  );
  const toReceiveAmountToday = remainingToday.reduce(
    (acc, cur) => acc + cur.price,
    0
  );
  const forecastAmountToday = receivedAmountToday + toReceiveAmountToday;

  // Group daily appointments by MANHÃ (<= 12:30) and TARDE (> 12:30)
  const morningAppts = dailyAppointments.filter((a) => {
    const [h, m] = a.time.split(":").map(Number);
    return h * 60 + m <= 12 * 60 + 30;
  });
  const afternoonAppts = dailyAppointments.filter((a) => {
    const [h, m] = a.time.split(":").map(Number);
    return h * 60 + m > 12 * 60 + 30;
  });

  // First scheduled (next active) appointment gets the left black accent bar & green dot
  const nextActiveAppointmentId = remainingToday[0]?.id ?? null;

  // Weekly Financial Summary for Configurações -> Financeiro
  const getWeekBounds = (refDateStr: string) => {
    if (!refDateStr || !refDateStr.includes("-")) {
      return { start: "2026-01-01", end: "2026-01-07" };
    }
    const [y, m, d] = refDateStr.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const day = dt.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(dt);
    monday.setDate(dt.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (dateObj: Date) => dateObj.toISOString().slice(0, 10);
    return { start: fmt(monday), end: fmt(sunday) };
  };

  const weekBounds = getWeekBounds(financeWeekDate);
  const weekAppointments = appointments.filter(
    (a) => a.date >= weekBounds.start && a.date <= weekBounds.end
  );
  const completedWeek = weekAppointments.filter(
    (a) => a.status === "concluido"
  );
  const scheduledWeek = weekAppointments.filter((a) => a.status === "agendado");
  const totalRevenueCompleted = completedWeek.reduce(
    (acc, cur) => acc + cur.price,
    0
  );
  const totalRevenueProjected = scheduledWeek.reduce(
    (acc, cur) => acc + cur.price,
    0
  );

  const firstName = (config?.professionalName || "Camila").split(" ")[0];
  const shortStudioTitle = (config?.studioName || "Bella Lash")
    .replace(/^Studio\s+/i, "")
    .trim();

  return (
    <div className="min-h-dvh bg-[#FAF8F5] text-[#111111] font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 bg-[#0F1115] text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap w-max max-w-[92vw] animate-toast">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div
        key={enterKey}
        ref={pullContainerRef}
        className="max-w-[440px] mx-auto min-h-dvh flex flex-col bg-[#FAF8F5] relative pb-22 overscroll-y-none"
      >
        {/* ==================== TOP EXECUTIVE HEADER (Figma Node 1-386) ==================== */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md px-5 pt-5 pb-4 border-b border-[#EFECE6] flex items-center justify-between animate-card">
          <div>
            <h1 className="text-[17px] font-extrabold text-[#111111] leading-tight">
              {shortStudioTitle || "Isabele Lash"}
            </h1>
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C] mt-0.5">
              PAINEL EXECUTIVO
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Toggle Value Cards Visibility (Eye Open / Closed) */}
            <button
              type="button"
              onClick={() => setShowValueCards((prev) => !prev)}
              aria-label={
                showValueCards
                  ? "Ocultar cards de valores"
                  : "Mostrar cards de valores"
              }
              title={
                showValueCards
                  ? "Ocultar cards de valores"
                  : "Mostrar cards de valores"
              }
              className="w-10 h-10 rounded-full bg-[#F4F1EC] hover:bg-[#EAE5DD] flex items-center justify-center text-[#111111] relative smooth-press cursor-pointer"
            >
              {showValueCards ? (
                <Eye className="w-[18px] h-[18px] stroke-[2]" />
              ) : (
                <EyeOff className="w-[18px] h-[18px] stroke-[2]" />
              )}
            </button>

            {/* Notification Bell Circle */}
            <button
              type="button"
              onClick={() => setShowNotificationsModal(true)}
              aria-label="Notificações"
              className="w-10 h-10 rounded-full bg-[#F4F1EC] hover:bg-[#EAE5DD] flex items-center justify-center text-[#111111] relative smooth-press cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px] stroke-[2]" />
              {whatsappEvents.some((ev) => !ev.read) && (
                <span className="w-2 h-2 rounded-full bg-[#10B981] absolute top-2.5 right-2.5 animate-pulse" />
              )}
            </button>

            {/* Right Profile Avatar Circle */}
            <button
              type="button"
              onClick={() => setBottomTab("configuracoes")}
              aria-label="Configurações"
              className="w-10 h-10 rounded-full overflow-hidden border border-[#E5E0D8] shadow-2xs shrink-0 smooth-press cursor-pointer"
            >
              <img
                src={config?.logoUrl || "/isa.png"}
                alt={config?.professionalName || "Isabele"}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Pull-to-refresh Indicator emerging from behind the header (only on Início tab) */}
        {bottomTab === "inicio" && (
          <div
            ref={pullSpacerRef}
            style={{ height: "0px" }}
            className="w-full overflow-hidden flex items-center justify-center pointer-events-none select-none will-change-[height]"
          >
            <div
              ref={pullCircleRef}
              style={{
                opacity: 0,
                backgroundColor: "rgb(255, 255, 255)",
                borderColor: "rgb(229, 224, 216)",
                color: "rgb(45, 43, 42)",
                transform: "translate3d(0, -38px, 0) scale(0.78)",
              }}
              className="w-10 h-10 rounded-full border flex items-center justify-center shadow-sm will-change-[transform,opacity,background-color]"
            >
              <RefreshCw
                ref={pullIconRef}
                className={`w-[18px] h-[18px] stroke-[2.3] ${
                  isRefreshingPull ? "animate-spin text-[#10B981]" : ""
                }`}
              />
            </div>
          </div>
        )}

        {/* ==================== TAB 1: INÍCIO (Figma Node 1-386 Executive Dashboard) ==================== */}
        {bottomTab === "inicio" && (
          <main key="tab-inicio" className="px-5 pt-5 flex-1 flex flex-col">
            {/* Greeting & Date Heading */}
            <div className="animate-card" style={{ animationDelay: "0ms" }}>
              <p className="text-[13px] font-semibold text-[#78716C]">
                Olá, {firstName}
              </p>
              <h2 className="text-[24px] font-extrabold text-[#111111] tracking-tight mt-0.5">
                {formatExecutiveTitleDate(agendaDate)}
              </h2>
            </div>

            {/* RESUMO DE HOJE CARD (Smooth 60fps open & close without margin snap) */}
            <div
              className={`grid transition-[grid-template-rows,opacity,transform,margin] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[grid-template-rows,opacity,transform] ${
                showValueCards
                  ? "grid-rows-[1fr] opacity-100 translate-y-0 scale-100 mt-6"
                  : "grid-rows-[0fr] opacity-0 -translate-y-2 scale-[0.98] pointer-events-none mt-0"
              }`}
            >
              <div className="overflow-hidden">
                {homeDisplayMode === "clientes" ? (
                  <section className="px-5 py-5 rounded-[24px] bg-[#141519] text-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex flex-col justify-center gap-2.5 smooth-card">
                    <span className="block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#A1A1AA] leading-none">
                      RESUMO DE HOJE
                    </span>
                    <div className="flex items-baseline gap-2 leading-none">
                      <span className="text-[22px] font-extrabold text-[#10B981] tracking-tight">
                        {dailyAppointments.length}
                      </span>
                      <span className="text-[16px] font-extrabold text-white tracking-tight">
                        {dailyAppointments.length === 1
                          ? "agendamento"
                          : "agendamentos"}
                      </span>
                    </div>
                  </section>
                ) : (
                  <section className="p-4 rounded-[26px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3.5 smooth-card">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#A8A29E]">
                        RESUMO DE HOJE
                      </span>
                      <span className="text-[12px] font-bold text-[#78716C]">
                        {dailyAppointments.length} clientes totais
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Box 1: Recebido */}
                      <div className="p-3.5 rounded-[20px] bg-[#141519] text-white flex flex-col justify-between min-h-[108px] smooth-press">
                        <span className="text-[11px] font-medium text-[#A1A1AA]">
                          Recebido
                        </span>
                        <div className="my-1">
                          <span className="text-[17px] font-extrabold text-[#10B981] tracking-tight">
                            {formatBRLCompact(receivedAmountToday)}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-[#A1A1AA]">
                          {completedToday.length} concluídos
                        </span>
                      </div>

                      {/* Box 2: A Receber */}
                      <div className="p-3.5 rounded-[20px] bg-[#141519] text-white flex flex-col justify-between min-h-[108px] smooth-press">
                        <span className="text-[11px] font-medium text-[#A1A1AA]">
                          A Receber
                        </span>
                        <div className="my-1">
                          <span className="text-[17px] font-extrabold text-white tracking-tight">
                            {formatBRLCompact(toReceiveAmountToday)}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-[#A1A1AA]">
                          {remainingToday.length} restantes
                        </span>
                      </div>

                      {/* Box 3: Previsão Dia */}
                      <div className="p-3.5 rounded-[20px] bg-[#141519] text-white flex flex-col justify-between min-h-[108px] smooth-press">
                        <span className="text-[11px] font-medium text-[#A1A1AA]">
                          Previsão Dia
                        </span>
                        <div className="my-1">
                          <span className="text-[17px] font-extrabold text-white tracking-tight">
                            {formatBRLCompact(forecastAmountToday)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#10B981]">
                          +100% meta
                        </span>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* AGENDA COMPLETA SECTION */}
            <section
              className="mt-6 flex-1 flex flex-col space-y-4 animate-card"
              style={{ animationDelay: "80ms" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-extrabold text-[#111111] tracking-tight">
                  Agenda Completa
                </h3>

                {/* Custom DatePicker Pill */}
                <DatePicker
                  variant="pill"
                  title="Data da Agenda"
                  value={agendaDate}
                  label={formatDatePillLabel(agendaDate, todayStr)}
                  onChange={(d) => setAgendaDate(d)}
                />
              </div>

              {dailyAppointments.length === 0 ? (
                <div className="flex-1 min-h-[150px] p-8 rounded-[24px] bg-white border border-[#EFECE6] flex flex-col items-center justify-center text-center space-y-2 shadow-2xs animate-card">
                  <p className="text-sm font-bold text-[#111111]">
                    Nenhum cliente agendado neste dia
                  </p>
                  <p className="text-xs text-[#78716C]">
                    Clique em <b>+ Agendar</b> abaixo para encaixar uma cliente
                    manualmente.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* MANHÃ GROUP */}
                  {morningAppts.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#A8A29E] px-1">
                        MANHÃ
                      </span>

                      <div className="space-y-2.5">
                        {morningAppts.map((appt, idx) => {
                          const isCompleted = appt.status === "concluido";

                          return (
                            <div
                              key={appt.id}
                              style={{ animationDelay: `${100 + idx * 45}ms` }}
                              onClick={() => setSelectedAppointment(appt)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  setSelectedAppointment(appt);
                              }}
                              className="p-4 rounded-[22px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.025)] flex items-center justify-between gap-3 cursor-pointer relative overflow-hidden animate-card smooth-card"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <span
                                  className={`text-[14px] font-extrabold shrink-0 ${
                                    isCompleted
                                      ? "text-[#78716C]"
                                      : "text-[#111111]"
                                  }`}
                                >
                                  {appt.time}
                                </span>

                                <div className="min-w-0">
                                  <h4 className="text-[15px] font-extrabold text-[#111111] truncate">
                                    {appt.clientName}
                                  </h4>
                                  <p className="text-[12px] font-medium text-[#78716C] truncate mt-0.5">
                                    {appt.serviceName} •{" "}
                                    {formatBRLCompact(appt.price)}
                                  </p>
                                </div>
                              </div>

                              {isCompleted && (
                                <div className="shrink-0">
                                  <span className="px-3 py-1.5 rounded-full bg-[#F4F1EC] text-[#57534E] text-[11px] font-bold inline-flex items-center gap-1">
                                    <Check className="w-3 h-3 text-[#10B981] stroke-[2.5]" />
                                    <span>Concluído</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TARDE GROUP */}
                  {afternoonAppts.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#A8A29E] px-1">
                        TARDE
                      </span>

                      <div className="space-y-2.5">
                        {afternoonAppts.map((appt, idx) => {
                          const isCompleted = appt.status === "concluido";

                          return (
                            <div
                              key={appt.id}
                              style={{ animationDelay: `${160 + idx * 45}ms` }}
                              onClick={() => setSelectedAppointment(appt)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  setSelectedAppointment(appt);
                              }}
                              className="p-4 rounded-[22px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.025)] flex items-center justify-between gap-3 cursor-pointer relative overflow-hidden animate-card smooth-card"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <span
                                  className={`text-[14px] font-extrabold shrink-0 ${
                                    isCompleted
                                      ? "text-[#78716C]"
                                      : "text-[#111111]"
                                  }`}
                                >
                                  {appt.time}
                                </span>

                                <div className="min-w-0">
                                  <h4 className="text-[15px] font-extrabold text-[#111111] truncate">
                                    {appt.clientName}
                                  </h4>
                                  <p className="text-[12px] font-medium text-[#78716C] truncate mt-0.5">
                                    {appt.serviceName} •{" "}
                                    {formatBRLCompact(appt.price)}
                                  </p>
                                </div>
                              </div>

                              {isCompleted && (
                                <div className="shrink-0">
                                  <span className="px-3 py-1.5 rounded-full bg-[#F4F1EC] text-[#57534E] text-[11px] font-bold inline-flex items-center gap-1">
                                    <Check className="w-3 h-3 text-[#10B981] stroke-[2.5]" />
                                    <span>Concluído</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* TWO ACTION BUTTONS AT BOTTOM OF CONTENT (Figma Node 1-386) */}
            <div
              className="grid grid-cols-2 gap-3 mt-5 pt-1 animate-card"
              style={{ animationDelay: "220ms" }}
            >
              <button
                type="button"
                onClick={() => {
                  setManualAppt((prev) => ({ ...prev, date: agendaDate }));
                  setShowManualModal(true);
                }}
                className="py-4 px-4 rounded-[20px] bg-[#141519] hover:bg-zinc-800 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md smooth-press cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Agendar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAgendaSubTab("configuracoes");
                  setBottomTab("agenda");
                }}
                className="py-4 px-4 rounded-[20px] bg-white hover:bg-[#F4F1EC] border border-[#E5E0D8] text-[#111111] font-bold text-[14px] flex items-center justify-center gap-2 shadow-2xs smooth-press cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                <span>Ajustar Horários</span>
              </button>
            </div>
          </main>
        )}

        {/* ==================== TAB 2: CATÁLOGO (Services Manager) ==================== */}
        {bottomTab === "catalogo" && (
          <main key="tab-catalogo" className="px-5 pt-5 space-y-5">
            <div className="flex items-center justify-between gap-2 animate-card">
              <div>
                <h2 className="text-[20px] font-extrabold text-[#111111]">
                  Catálogo
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingService({
                    name: "",
                    category: "Extensão de Cílios",
                    description: "",
                    price: 190,
                    duration: "1h 30min",
                    imageUrl:
                      "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=700&auto=format&fit=crop&q=80",
                    featured: false,
                    active: true,
                    order: services.length + 1,
                  })
                }
                className="px-3.5 py-2.5 rounded-2xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 smooth-press cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {services.map((srv, idx) => (
                <div
                  key={srv.id}
                  style={{ animationDelay: `${idx * 35}ms` }}
                  onClick={() => setEditingService(srv)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setEditingService(srv);
                  }}
                  className="p-3.5 rounded-[22px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3 cursor-pointer animate-card smooth-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {srv.imageUrl && (
                      <img
                        src={srv.imageUrl}
                        alt={srv.name}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 bg-[#F4F1EC]"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#111111] truncate">
                        {srv.name}
                      </p>
                      <p className="text-xs font-semibold text-[#78716C]">
                        {formatBRL(srv.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label="Editar procedimento"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingService(srv);
                      }}
                      className="p-2.5 rounded-xl bg-[#F4F1EC] hover:bg-[#E8E3DC] text-[#111111] smooth-press cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir procedimento"
                      disabled={busyAction === `del-srv-${srv.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        runAdminAction(`del-srv-${srv.id}`, {
                          action: "delete_service",
                          id: srv.id,
                        });
                      }}
                      className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 smooth-press cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* ==================== TAB 3: AGENDA (Mensal & Configurações de Horários/Folgas) ==================== */}
        {bottomTab === "agenda" && config && (
          <main key="tab-agenda" className="px-5 pt-5 space-y-5">
            <div className="flex items-center justify-between gap-3 animate-card">
              <h2 className="text-[20px] font-extrabold text-[#111111]">
                {agendaSubTab === "agenda"
                  ? "Agenda do Mês"
                  : "Ajustar Horários & Folgas"}
              </h2>

              {agendaSubTab === "agenda" && (
                <button
                  type="button"
                  onClick={toggleOnlyScheduledDays}
                  aria-label={
                    onlyScheduledDays
                      ? "Exibir todos os dias do mês"
                      : "Exibir somente dias com procedimento marcado"
                  }
                  title={
                    onlyScheduledDays
                      ? "Exibindo apenas dias com procedimento (toque para exibir todo o mês)"
                      : "Exibindo todo o mês (toque para exibir apenas dias com procedimento)"
                  }
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 smooth-press cursor-pointer shrink-0 ${
                    onlyScheduledDays
                      ? "bg-[#141519] text-white border-[#141519] shadow-sm"
                      : "bg-[#F4F1EC] hover:bg-[#EAE5DD] text-[#111111] border-[#E5E0D8]"
                  }`}
                >
                  <Calendar className="w-[18px] h-[18px] stroke-[2.2]" />
                </button>
              )}
            </div>

            {/* Q-Tab Selector: Agenda / Configurações */}
            <div
              className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#F4F1EC] animate-card"
              style={{ animationDelay: "40ms" }}
            >
              {[
                { id: "agenda", label: "Agenda" },
                { id: "configuracoes", label: "Configurações" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setAgendaSubTab(tab.id as "agenda" | "configuracoes")
                  }
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold smooth-press cursor-pointer ${
                    agendaSubTab === tab.id
                      ? "bg-[#141519] text-white shadow-xs"
                      : "text-[#78716C] hover:text-[#111111]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {agendaSubTab === "agenda" ? (
              (() => {
                const currentYM =
                  agendaMonthYear ||
                  (todayStr ? todayStr.slice(0, 7) : "2026-11");
                const [yNum, mNum] = currentYM.split("-").map(Number);
                const year = yNum || 2026;
                const monthIndex = (mNum || 1) - 1;
                const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

                const changeMonth = (delta: number) => {
                  const dt = new Date(year, monthIndex + delta, 1);
                  const nextY = dt.getFullYear();
                  const nextM = String(dt.getMonth() + 1).padStart(2, "0");
                  setAgendaMonthYear(`${nextY}-${nextM}`);
                };

                // Count non-canceled appointments per date in this month
                const countByDate: Record<string, number> = {};
                let totalMonthProcedures = 0;
                for (const appt of appointments) {
                  if (
                    appt.status !== "cancelado" &&
                    appt.date.startsWith(currentYM)
                  ) {
                    countByDate[appt.date] = (countByDate[appt.date] || 0) + 1;
                    totalMonthProcedures += 1;
                  }
                }

                // Check full-day blocks per date
                const blockedDateMap: Record<string, string> = {};
                for (const blk of blocks) {
                  if (blk.type === "dia" && blk.date.startsWith(currentYM)) {
                    blockedDateMap[blk.date] = blk.reason || "Folga";
                  }
                }

                const daysList = Array.from(
                  { length: daysInMonth },
                  (_, idx) => {
                    const dayNumber = idx + 1;
                    const dayStr = String(dayNumber).padStart(2, "0");
                    const mStr = String(monthIndex + 1).padStart(2, "0");
                    const fullDate = `${year}-${mStr}-${dayStr}`;
                    const weekdayIdx = new Date(
                      year,
                      monthIndex,
                      dayNumber
                    ).getDay();
                    return {
                      dayNumber,
                      dayStr,
                      fullDate,
                      weekdayName: WEEKDAYS_SHORT_PT[weekdayIdx],
                      count: countByDate[fullDate] || 0,
                      isToday: fullDate === todayStr,
                      isSelected: fullDate === agendaDate,
                      blockReason: blockedDateMap[fullDate] || "",
                    };
                  }
                );

                const visibleDaysList = onlyScheduledDays
                  ? daysList.filter((d) => d.count > 0)
                  : daysList;

                return (
                  <div
                    key="sub-agenda-mes"
                    className="space-y-4 animate-card"
                    style={{ animationDelay: "70ms" }}
                  >
                    {/* Month Selector Header */}
                    <div className="p-3.5 rounded-[22px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        aria-label="Mês anterior"
                        className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] hover:bg-[#F3EFEA] flex items-center justify-center text-[#111111] smooth-press cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
                      </button>

                      <div className="text-center">
                        <span className="block text-[14px] font-extrabold text-[#111111] tracking-tight">
                          {MONTHS_PT[monthIndex]} {year}
                        </span>
                        <span className="block text-[11px] font-semibold text-[#78716C]">
                          {totalMonthProcedures}{" "}
                          {totalMonthProcedures === 1
                            ? "procedimento agendado"
                            : "procedimentos agendados"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        aria-label="Próximo mês"
                        className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] hover:bg-[#F3EFEA] flex items-center justify-center text-[#111111] smooth-press cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                      </button>
                    </div>

                    {/* Days of the Month List */}
                    {visibleDaysList.length === 0 ? (
                      <div className="p-8 rounded-[22px] bg-white border border-[#EFECE6] text-center space-y-2 shadow-2xs animate-expand">
                        <p className="text-sm font-bold text-[#111111]">
                          Nenhum dia com procedimento neste mês
                        </p>
                        <p className="text-xs text-[#78716C]">
                          Toque no ícone de calendário acima para exibir todos os dias do mês.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {visibleDaysList.map((d) => {
                        const hasAppts = d.count > 0;
                        return (
                          <button
                            key={d.fullDate}
                            type="button"
                            onClick={() => {
                              setAgendaDate(d.fullDate);
                              setBottomTab("inicio");
                            }}
                            className={`w-full p-3.5 rounded-[20px] flex items-center justify-between gap-3 text-left smooth-card smooth-press cursor-pointer border ${
                              d.isToday
                                ? "bg-white border-[#141519] shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
                                : hasAppts
                                ? "bg-white border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.025)]"
                                : "bg-white/75 border-transparent hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                                  d.isToday
                                    ? "bg-[#141519] text-white"
                                    : hasAppts
                                    ? "bg-[#EADCE0] text-[#111111]"
                                    : "bg-[#F4F1EC] text-[#78716C]"
                                }`}
                              >
                                <span className="text-[15px] font-extrabold leading-none">
                                  {d.dayStr}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase mt-0.5 ${
                                    d.isToday
                                      ? "text-zinc-300"
                                      : "text-[#78716C]"
                                  }`}
                                >
                                  {MONTHS_SHORT_PT[monthIndex]}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px] font-extrabold text-[#111111] truncate">
                                    {d.weekdayName}
                                  </span>
                                  {d.isToday && (
                                    <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] text-[10px] font-extrabold uppercase">
                                      Hoje
                                    </span>
                                  )}
                                  {d.blockReason && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold truncate max-w-[120px]">
                                      Bloqueado
                                    </span>
                                  )}
                                </div>
                                <p className="text-[12px] font-medium text-[#78716C] truncate mt-0.5">
                                  {hasAppts
                                    ? `${d.count} ${
                                        d.count === 1
                                          ? "procedimento agendado"
                                          : "procedimentos agendados"
                                      }`
                                    : d.blockReason
                                    ? d.blockReason
                                    : "Sem agendamentos"}
                                </p>
                              </div>
                            </div>

                            {/* Right Numeric Indicator Badge */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`min-w-[30px] h-[30px] px-2.5 rounded-full text-[12px] font-extrabold flex items-center justify-center ${
                                  hasAppts
                                    ? "bg-[#141519] text-white shadow-2xs"
                                    : "bg-[#F4F1EC] text-[#A8A29E]"
                                }`}
                              >
                                {d.count}
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
                            </div>
                          </button>
                        );
                      })}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div key="sub-agenda-config" className="space-y-6">
                {/* Grade de Horários */}
                <section
                  className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4 animate-card smooth-card"
                  style={{ animationDelay: "50ms" }}
                >
                  <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">
                    Horários Padrões do Dia
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {config.availableSlots.map((slot) => (
                      <div
                        key={slot}
                        className="px-3.5 py-2 rounded-xl bg-[#F4F1EC] flex items-center gap-2 text-xs font-extrabold text-[#111111] smooth-press"
                      >
                        <span>{slot}</span>
                        <button
                          type="button"
                          aria-label={`Remover horário ${slot}`}
                          onClick={() => {
                            const updated = config.availableSlots.filter(
                              (s) => s !== slot
                            );
                            setConfig({ ...config, availableSlots: updated });
                            runAdminAction("update-slots", {
                              action: "update_config",
                              availableSlots: updated,
                            });
                          }}
                          className="text-[#78716C] hover:text-red-600 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className="flex-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    />
                    <button
                      type="button"
                      disabled={busyAction === "add-slot"}
                      onClick={() => {
                        if (!newSlotTime) return;
                        const updated = Array.from(
                          new Set([...config.availableSlots, newSlotTime])
                        ).sort();
                        setConfig({ ...config, availableSlots: updated });
                        runAdminAction("add-slot", {
                          action: "update_config",
                          availableSlots: updated,
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs smooth-press cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#F0ECE6] space-y-2">
                    <label className="text-xs font-bold text-[#111111] block">
                      Antecedência mínima no mesmo dia
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={config.minAdvanceHours}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            minAdvanceHours: Number(e.target.value),
                          })
                        }
                        className="flex-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-bold"
                      >
                        <option value={0}>Sem antecedência mínima</option>
                        <option value={1}>1 hora antes</option>
                        <option value={2}>2 horas antes</option>
                        <option value={3}>3 horas antes</option>
                        <option value={4}>4 horas antes</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          runAdminAction("save-advance", {
                            action: "update_config",
                            minAdvanceHours: config.minAdvanceHours,
                          })
                        }
                        className="px-4 py-2.5 rounded-xl bg-[#F4F1EC] hover:bg-[#E7E2DA] text-[#111111] text-xs font-bold smooth-press cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                </section>

                {/* Bloqueios e Folgas */}
                <section
                  className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4 animate-card smooth-card"
                  style={{ animationDelay: "100ms" }}
                >
                  <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">
                    Bloquear Data ou Período
                  </h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                          Data
                        </label>
                        <DatePicker
                          variant="input"
                          title="Data do Bloqueio"
                          value={newBlock.date}
                          onChange={(d) =>
                            setNewBlock({ ...newBlock, date: d })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                          Tipo
                        </label>
                        <select
                          value={newBlock.type}
                          onChange={(e) =>
                            setNewBlock({ ...newBlock, type: e.target.value })
                          }
                          className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium"
                        >
                          <option value="dia">Dia inteiro</option>
                          <option value="horario">Intervalo</option>
                        </select>
                      </div>
                    </div>

                    <div
                      className={`grid transition-[grid-template-rows,opacity,transform,margin] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[grid-template-rows,opacity,transform] ${
                        newBlock.type === "horario"
                          ? "grid-rows-[1fr] opacity-100 translate-y-0 mt-3"
                          : "grid-rows-[0fr] opacity-0 -translate-y-1.5 pointer-events-none mt-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                              Início
                            </label>
                            <input
                              type="time"
                              value={newBlock.startTime}
                              onChange={(e) =>
                                setNewBlock({
                                  ...newBlock,
                                  startTime: e.target.value,
                                })
                              }
                              className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                              Fim
                            </label>
                            <input
                              type="time"
                              value={newBlock.endTime}
                              onChange={(e) =>
                                setNewBlock({
                                  ...newBlock,
                                  endTime: e.target.value,
                                })
                              }
                              className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                        Motivo
                      </label>
                      <input
                        type="text"
                        value={newBlock.reason}
                        onChange={(e) =>
                          setNewBlock({ ...newBlock, reason: e.target.value })
                        }
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={busyAction === "add-block"}
                      onClick={() =>
                        runAdminAction("add-block", {
                          action: "add_block",
                          ...newBlock,
                        })
                      }
                      className="w-full py-3.5 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs smooth-press cursor-pointer"
                    >
                      Registrar Bloqueio de Agenda
                    </button>
                  </div>

                  {blocks.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-[#F0ECE6]">
                      {blocks.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl bg-[#FAF8F5] flex items-center justify-between text-xs animate-expand"
                        >
                          <div>
                            <span className="font-bold text-[#111111]">
                              {b.date.split("-").reverse().join("/")}
                            </span>{" "}
                            —{" "}
                            {b.type === "dia"
                              ? "Dia Inteiro"
                              : `${b.startTime} às ${b.endTime}`}{" "}
                            ({b.reason})
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              runAdminAction(`del-blk-${b.id}`, {
                                action: "delete_block",
                                id: b.id,
                              })
                            }
                            className="text-red-600 font-bold hover:underline cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </main>
        )}

        {/* ==================== TAB 4: CONFIGURAÇÕES (Painel Administrativo + Linktree) ==================== */}
        {bottomTab === "configuracoes" && config && (
          <main key="tab-config" className="px-5 pt-5 space-y-7">
            {/* ==================== PARTE 1: PAINEL ADMINISTRATIVO ==================== */}
            <div className="space-y-4">
              <div className="animate-card">
                <h2 className="text-[20px] font-extrabold text-[#111111]">
                  Painel Administrativo
                </h2>
                <p className="text-xs text-[#78716C]">
                  Personalize o estúdio, caixa semanal e segurança.
                </p>
              </div>

              {/* Sub-tabs selector */}
              <div
                className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#F4F1EC] animate-card"
                style={{ animationDelay: "40ms" }}
              >
                {[
                  { id: "linktree", label: "Estúdio & Bio" },
                  { id: "financeiro", label: "Caixa Semanal" },
                  { id: "clientes", label: "Segurança" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      setConfigSubTab(
                        st.id as "linktree" | "financeiro" | "clientes"
                      )
                    }
                    className={`py-2 px-2 rounded-xl text-xs font-bold smooth-press cursor-pointer ${
                      configSubTab === st.id
                        ? "bg-[#141519] text-white shadow-xs"
                        : "text-[#78716C] hover:text-[#111111]"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {configSubTab === "linktree" && (
                <section
                  key="sub-estudio"
                  className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5 animate-card smooth-card"
                  style={{ animationDelay: "80ms" }}
                >
                  <h3 className="text-sm font-extrabold text-[#111111]">
                    Dados do Estúdio
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                        Nome do Estúdio
                      </label>
                      <input
                        type="text"
                        value={config.studioName}
                        onChange={(e) =>
                          setConfig({ ...config, studioName: e.target.value })
                        }
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                        Profissional (Lash Designer)
                      </label>
                      <input
                        type="text"
                        value={config.professionalName}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            professionalName: e.target.value,
                          })
                        }
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                          WhatsApp
                        </label>
                        <input
                          type="text"
                          value={config.whatsapp}
                          onChange={(e) =>
                            setConfig({ ...config, whatsapp: e.target.value })
                          }
                          className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                          Instagram
                        </label>
                        <input
                          type="text"
                          value={config.instagram}
                          onChange={(e) =>
                            setConfig({ ...config, instagram: e.target.value })
                          }
                          className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                        Foto de Perfil
                      </label>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#E5E0D8] border border-[#D6CFC5] shrink-0">
                          <img
                            src={config.logoUrl || "/isa.png"}
                            alt="Foto de perfil"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white text-xs font-bold smooth-press cursor-pointer">
                            <span>Escolher Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const dataUrl =
                                    await readImageFileAsDataUrl(file);
                                  setConfig({ ...config, logoUrl: dataUrl });
                                } catch {
                                  showToast("Não foi possível carregar a foto.");
                                } finally {
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                          <p className="text-[10px] text-[#78716C] mt-1 truncate">
                            Selecione uma imagem do seu dispositivo
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={config.address}
                        onChange={(e) =>
                          setConfig({ ...config, address: e.target.value })
                        }
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busyAction === "save-identity"}
                    onClick={() =>
                      runAdminAction("save-identity", {
                        action: "update_config",
                        ...config,
                      })
                    }
                    className="w-full py-3.5 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 smooth-press cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Dados do Estúdio</span>
                  </button>
                </section>
              )}

              {configSubTab === "financeiro" && (
                <div key="sub-financeiro" className="space-y-6">
                  <section className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4 animate-card smooth-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#111111]">
                          Caixa da Semana
                        </h3>
                        <p className="text-[11px] text-[#78716C]">
                          {weekBounds.start.split("-").reverse().join("/")} a{" "}
                          {weekBounds.end.split("-").reverse().join("/")}
                        </p>
                      </div>
                      <DatePicker
                        variant="compact"
                        title="Semana de Referência"
                        value={financeWeekDate}
                        onChange={(d) => setFinanceWeekDate(d)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-4 rounded-2xl bg-[#141519] text-white smooth-press">
                        <span className="text-[11px] text-[#A1A1AA]">
                          Recebido Semana
                        </span>
                        <p className="text-xl font-extrabold text-[#10B981] mt-1">
                          {formatBRLCompact(totalRevenueCompleted)}
                        </p>
                        <span className="text-[10px] text-[#A1A1AA]">
                          {completedWeek.length} concluídos
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#F4F1EC] text-[#111111] smooth-press">
                        <span className="text-[11px] text-[#78716C]">
                          A Receber Semana
                        </span>
                        <p className="text-xl font-extrabold text-[#111111] mt-1">
                          {formatBRLCompact(totalRevenueProjected)}
                        </p>
                        <span className="text-[10px] text-[#78716C]">
                          {scheduledWeek.length} agendados
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Histórico de Pagamentos dos Procedimentos */}
                  <div className="space-y-4 pt-2 border-t border-[#EFECE6]">
                    <div
                      className="animate-card"
                      style={{ animationDelay: "80ms" }}
                    >
                      <h2 className="text-[20px] font-extrabold text-[#111111]">
                        Histórico de Pagamentos
                      </h2>
                    </div>

                    <section
                      className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3 animate-card smooth-card"
                      style={{ animationDelay: "110ms" }}
                    >
                      {weekAppointments.filter(
                        (a) => a.status === "concluido" || a.status === "agendado"
                      ).length === 0 ? (
                        <div className="py-6 text-center space-y-1">
                          <p className="text-xs font-bold text-[#111111]">
                            Nenhum procedimento nesta semana
                          </p>
                          <p className="text-[11px] text-[#78716C]">
                            Selecione outra data acima para consultar o histórico de pagamentos.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {[...weekAppointments]
                            .filter(
                              (a) =>
                                a.status === "concluido" ||
                                a.status === "agendado"
                            )
                            .sort((a, b) => {
                              if (a.date !== b.date)
                                return b.date.localeCompare(a.date);
                              return b.time.localeCompare(a.time);
                            })
                            .map((appt) => {
                              const isPaid = appt.status === "concluido";
                              const shortDate = appt.date
                                .split("-")
                                .reverse()
                                .slice(0, 2)
                                .join("/");

                              return (
                                <div
                                  key={appt.id}
                                  onClick={() => setSelectedAppointment(appt)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ")
                                      setSelectedAppointment(appt);
                                  }}
                                  className="p-3.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#EFECE6] flex items-center justify-between gap-3 cursor-pointer smooth-card"
                                >
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-extrabold text-[#111111] truncate">
                                        {appt.serviceName}
                                      </p>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                                          isPaid
                                            ? "bg-[#10B981]/15 text-[#059669]"
                                            : "bg-[#E7E2DA] text-[#57534E]"
                                        }`}
                                      >
                                        {isPaid ? "Pago" : "A receber"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-[#78716C] truncate">
                                      {appt.clientName} • {shortDate} às{" "}
                                      {appt.time}
                                    </p>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span
                                      className={`text-sm font-extrabold ${
                                        isPaid
                                          ? "text-[#10B981]"
                                          : "text-[#111111]"
                                      }`}
                                    >
                                      {isPaid ? "+ " : ""}
                                      {formatBRL(appt.price)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              )}

              {configSubTab === "clientes" && (
                <div key="sub-clientes" className="space-y-4">
                  <section className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5 animate-card smooth-card">
                    <h3 className="text-sm font-extrabold text-[#111111]">
                      Bloquear Número de Cliente
                    </h3>
                    <div className="space-y-2.5">
                      <input
                        type="tel"
                        value={newBlockedPhone}
                        onChange={(e) => setNewBlockedPhone(e.target.value)}
                        placeholder="WhatsApp com DDD (ex: 11988887777)"
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                      />
                      <input
                        type="text"
                        value={newBlockedName}
                        onChange={(e) => setNewBlockedName(e.target.value)}
                        placeholder="Nome (opcional)"
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          runAdminAction(
                            "block-client",
                            {
                              action: "block_client",
                              phone: newBlockedPhone,
                              name: newBlockedName,
                              reason: "Bloqueada no painel",
                            },
                            () => {
                              setNewBlockedPhone("");
                              setNewBlockedName("");
                            }
                          )
                        }
                        className="w-full py-3 rounded-xl bg-[#141519] text-white font-bold text-xs smooth-press cursor-pointer"
                      >
                        Bloquear Cliente
                      </button>
                    </div>

                    {blockedClients.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {blockedClients.map((bc) => (
                          <div
                            key={bc.id}
                            className="p-3 rounded-xl bg-[#FAF8F5] flex items-center justify-between text-xs animate-expand"
                          >
                            <span>
                              <b>{bc.phone}</b> {bc.name && `(${bc.name})`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                runAdminAction(`unblock-${bc.id}`, {
                                  action: "unblock_client",
                                  id: bc.id,
                                })
                              }
                              className="text-[#10B981] font-bold cursor-pointer"
                            >
                              Desbloquear
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section
                    className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5 animate-card smooth-card"
                    style={{ animationDelay: "50ms" }}
                  >
                    <h3 className="text-sm font-extrabold text-[#111111]">
                      Credenciais de Acesso
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={config.adminUsername}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            adminUsername: e.target.value,
                          })
                        }
                        placeholder="Usuário"
                        className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                      />
                      <input
                        type="text"
                        value={config.adminPassword || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            adminPassword: e.target.value,
                          })
                        }
                        placeholder="Nova senha"
                        className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        runAdminAction("save-creds", {
                          action: "update_config",
                          adminUsername: config.adminUsername,
                          adminPassword: config.adminPassword,
                        })
                      }
                      className="w-full py-3 rounded-xl bg-[#141519] text-white font-bold text-xs smooth-press cursor-pointer"
                    >
                      Atualizar Senha
                    </button>
                  </section>
                </div>
              )}
            </div>

            {/* ==================== PARTE 2: LINKTREE (Apenas na aba Estúdio & Bio) ==================== */}
            {configSubTab === "linktree" && (
            <>
              {/* Toggle: Exibição em Início (Clientes vs Tudo) */}
              <div
                className="space-y-2.5 pt-2 border-t border-[#EFECE6] animate-card"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-xs font-extrabold text-[#111111]">
                    Exibição em Início
                  </span>
                  <span className="text-[11px] font-medium text-[#78716C]">
                    Card de resumo do dia
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#F4F1EC]">
                  {(
                    [
                      { id: "clientes", label: "Clientes" },
                      { id: "tudo", label: "Tudo" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setHomeDisplayMode(opt.id);
                        try {
                          localStorage.setItem(
                            "lash_home_display_mode",
                            opt.id
                          );
                        } catch {
                          // ignore localStorage write errors
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold smooth-press cursor-pointer ${
                        homeDisplayMode === opt.id
                          ? "bg-[#141519] text-white shadow-xs"
                          : "text-[#78716C] hover:text-[#111111]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            <div className="space-y-4 pt-2 border-t border-[#EFECE6]">
              <div
                className="animate-card"
                style={{ animationDelay: "120ms" }}
              >
                <h2 className="text-[20px] font-extrabold text-[#111111]">
                  Linktree
                </h2>
                <p className="text-xs text-[#78716C]">
                  Gerencie os botões da sua página inicial e compartilhe o link da bio.
                </p>
              </div>

              <section
                className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4 animate-card smooth-card"
                style={{ animationDelay: "150ms" }}
              >
                {/* Barra de Ações Rápidas dentro do Card do Linktree */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6]">
                  <button
                    type="button"
                    onClick={copyPublicLink}
                    className="py-2.5 px-2 rounded-xl bg-white border border-[#E5E0D8] hover:bg-[#F4F1EC] text-[#111111] text-[11px] font-bold flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#111111] shrink-0" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="py-2.5 px-2 rounded-xl bg-white border border-[#E5E0D8] hover:bg-[#F4F1EC] text-[#111111] text-[11px] font-bold flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#111111] shrink-0" />
                    <span>Ver Página</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2.5 px-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[11px] font-bold flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Sair</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <h3 className="text-sm font-extrabold text-[#111111]">
                    Botões do Linktree
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingLink({
                        title: "",
                        subtitle: "",
                        url: "/agendar",
                        icon: "sparkles",
                        highlight: false,
                        active: true,
                        order: links.length + 1,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white text-xs font-bold smooth-press cursor-pointer"
                  >
                    + Botão
                  </button>
                </div>

                <div className="space-y-2">
                  {links.map((lk) => (
                    <div
                      key={lk.id}
                      className="p-3 rounded-xl bg-[#FAF8F5] flex items-center justify-between gap-2 text-xs smooth-card"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#111111] truncate">
                          {lk.title}
                        </p>
                        <p className="text-[11px] text-[#78716C] truncate">
                          {lk.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingLink(lk)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] font-bold smooth-press cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          aria-label="Remover botão"
                          onClick={() =>
                            runAdminAction(`del-lk-${lk.id}`, {
                              action: "delete_link",
                              id: lk.id,
                            })
                          }
                          className="p-1.5 rounded-lg text-red-600 smooth-press cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            </>
            )}
          </main>
        )}

        {/* ==================== BOTTOM NAVIGATION BAR (Figma Node 1-386) ==================== */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EFECE6] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-[440px] mx-auto px-6 pt-2.5 pb-3.5 flex items-center justify-between">
            {/* Início (Lotus / Leaf Icon) */}
            <button
              type="button"
              onClick={() => setBottomTab("inicio")}
              className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-3 smooth-press cursor-pointer ${
                bottomTab === "inicio"
                  ? "text-[#111111] font-extrabold scale-105"
                  : "text-[#A8A29E] font-medium hover:text-[#111111]"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-[22px] h-[22px]"
              >
                <path d="M12 3C10.2 6.2 9 9.5 9 12.5C9 15.2 10.3 17.4 12 18.8C13.7 17.4 15 15.2 15 12.5C15 9.5 13.8 6.2 12 3ZM4 9C4 13.8 7 17.6 11.2 19C8.9 17.2 7.5 14.5 7.5 11.5C7.5 10.6 7.6 9.7 7.8 8.8C6.3 8.5 5 8.6 4 9ZM20 9C19 8.6 17.7 8.5 16.2 8.8C16.4 9.7 16.5 10.6 16.5 11.5C16.5 14.5 15.1 17.2 12.8 19C17 17.6 20 13.8 20 9Z" />
              </svg>
              <span className="text-[11px]">Início</span>
            </button>

            {/* Catálogo (Swatches / Book Icon) */}
            <button
              type="button"
              onClick={() => setBottomTab("catalogo")}
              className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-3 smooth-press cursor-pointer ${
                bottomTab === "catalogo"
                  ? "text-[#111111] font-extrabold scale-105"
                  : "text-[#A8A29E] font-medium hover:text-[#111111]"
              }`}
            >
              <BookOpen className="w-[22px] h-[22px] stroke-[2]" />
              <span className="text-[11px]">Catálogo</span>
            </button>

            {/* Agenda (Calendar Icon) */}
            <button
              type="button"
              onClick={() => setBottomTab("agenda")}
              className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-3 smooth-press cursor-pointer ${
                bottomTab === "agenda"
                  ? "text-[#111111] font-extrabold scale-105"
                  : "text-[#A8A29E] font-medium hover:text-[#111111]"
              }`}
            >
              <Calendar className="w-[22px] h-[22px] stroke-[2]" />
              <span className="text-[11px]">Agenda</span>
            </button>

            {/* Configurações (Settings Gear Icon) */}
            <button
              type="button"
              onClick={() => setBottomTab("configuracoes")}
              className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-3 smooth-press cursor-pointer ${
                bottomTab === "configuracoes"
                  ? "text-[#111111] font-extrabold scale-105"
                  : "text-[#A8A29E] font-medium hover:text-[#111111]"
              }`}
            >
              <Settings className="w-[22px] h-[22px] stroke-[2]" />
              <span className="text-[11px]">Configurações</span>
            </button>
          </div>
        </nav>
      </div>

      {/* ==================== MODAL: EDITAR / NOVO PROCEDIMENTO ==================== */}
      <AnimatedModal
        open={Boolean(editingService)}
        onClose={() => setEditingService(null)}
      >
        {editingService && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#111111]">
                {editingService.id
                  ? "Editar Procedimento"
                  : "Novo Procedimento"}
              </h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setEditingService(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  Nome do Procedimento *
                </label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ex: Clássico Fio a Fio"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingService.price}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={editingService.category}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  Foto do Procedimento
                </label>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#E5E0D8] border border-[#D6CFC5] shrink-0">
                    {editingService.imageUrl ? (
                      <img
                        src={editingService.imageUrl}
                        alt={editingService.name || "Procedimento"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#78716C]">
                        Sem foto
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white text-xs font-bold smooth-press cursor-pointer">
                      <span>Escolher Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const dataUrl = await readImageFileAsDataUrl(file);
                            setEditingService({
                              ...editingService,
                              imageUrl: dataUrl,
                            });
                          } catch {
                            showToast("Não foi possível carregar a foto.");
                          } finally {
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-[#78716C] mt-1 truncate">
                      Selecione uma imagem do seu dispositivo
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.featured}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        featured: e.target.checked,
                      })
                    }
                  />
                  <span>Mais Pedido</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.active}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        active: e.target.checked,
                      })
                    }
                  />
                  <span>Ativo</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={busyAction === "save-service"}
                  onClick={() =>
                    runAdminAction(
                      "save-service",
                      {
                        action: "save_service",
                        service: editingService,
                      },
                      () => setEditingService(null)
                    )
                  }
                  className="flex-1 py-3.5 rounded-[18px] bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                >
                  {busyAction === "save-service" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Salvar Procedimento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-3.5 rounded-[18px] bg-[#F4F1EC] text-[#111111] text-xs font-bold smooth-press cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* ==================== MODAL: EDITAR / NOVO BOTÃO LINKTREE ==================== */}
      <AnimatedModal
        open={Boolean(editingLink)}
        onClose={() => setEditingLink(null)}
      >
        {editingLink && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#111111]">
                {editingLink.id ? "Editar Botão" : "Novo Botão do Linktree"}
              </h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setEditingLink(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  Título do Botão *
                </label>
                <input
                  type="text"
                  value={editingLink.title}
                  onChange={(e) =>
                    setEditingLink({
                      ...editingLink,
                      title: e.target.value,
                    })
                  }
                  placeholder="Ex: Agendar Meu Horário Online"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  Destino (/agendar, /catalogo, whatsapp:default) *
                </label>
                <input
                  type="text"
                  value={editingLink.url}
                  onChange={(e) =>
                    setEditingLink({
                      ...editingLink,
                      url: e.target.value,
                    })
                  }
                  placeholder="/agendar"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs font-medium"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    runAdminAction(
                      "save-link",
                      {
                        action: "save_link",
                        link: editingLink,
                      },
                      () => setEditingLink(null)
                    )
                  }
                  className="flex-1 py-3.5 rounded-[18px] bg-[#141519] text-white text-xs font-bold smooth-press cursor-pointer"
                >
                  Salvar Botão
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-3.5 rounded-[18px] bg-[#F4F1EC] text-xs font-bold smooth-press cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* ==================== MODAL: DETALHES DO AGENDAMENTO SELECIONADO ==================== */}
      <AnimatedModal
        open={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
      >
        {selectedAppointment && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#78716C]">
                  ATENDIMENTO • {selectedAppointment.time}
                </span>
                <h3 className="text-lg font-extrabold text-[#111111]">
                  {selectedAppointment.clientName}
                </h3>
                <p className="text-xs font-semibold text-[#78716C]">
                  {selectedAppointment.serviceName} •{" "}
                  {formatBRL(selectedAppointment.price)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setSelectedAppointment(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F1EC] space-y-1.5 text-xs">
              <p>
                <b>WhatsApp:</b> {selectedAppointment.clientPhone}
              </p>
              {selectedAppointment.clientAddress && (
                <p>
                  <b>Endereço (Domicílio):</b>{" "}
                  {selectedAppointment.clientAddress}
                </p>
              )}
              {selectedAppointment.clientNotes && (
                <p>
                  <b>Observações:</b> {selectedAppointment.clientNotes}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  openWhatsAppClient(
                    selectedAppointment.clientPhone,
                    `Olá ${selectedAppointment.clientName}! ✨ Passando para confirmar seu horário de *${selectedAppointment.serviceName}* às *${selectedAppointment.time}*.`
                  )
                }
                className="py-3.5 px-3 rounded-2xl bg-[#F4F1EC] hover:bg-[#E7E2DA] text-[#111111] font-bold text-xs flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
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
                <span>WhatsApp</span>
              </button>

              {selectedAppointment.status !== "concluido" ? (
                <button
                  type="button"
                  onClick={() =>
                    runAdminAction(
                      `appt-${selectedAppointment.id}`,
                      {
                        action: "update_appointment_status",
                        id: selectedAppointment.id,
                        status: "concluido",
                      },
                      () => setSelectedAppointment(null)
                    )
                  }
                  className="py-3.5 px-3 rounded-2xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span>Concluir</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    runAdminAction(
                      `appt-${selectedAppointment.id}`,
                      {
                        action: "update_appointment_status",
                        id: selectedAppointment.id,
                        status: "agendado",
                      },
                      () => setSelectedAppointment(null)
                    )
                  }
                  className="py-3.5 px-3 rounded-2xl bg-[#F4F1EC] text-[#111111] font-bold text-xs smooth-press cursor-pointer"
                >
                  Reabrir Horário
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#F0ECE6]">
              <button
                type="button"
                onClick={() =>
                  setConfirmCancelAppointment(selectedAppointment)
                }
                className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm smooth-press cursor-pointer"
              >
                <XCircle className="w-4 h-4 stroke-[2.2]" />
                <span>Desmarcar horário</span>
              </button>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* ==================== MODAL: CONFIRMAR DESMARCAÇÃO DE HORÁRIO (PADRÃO DO SISTEMA) ==================== */}
      <AnimatedModal
        open={Boolean(confirmCancelAppointment)}
        onClose={() => setConfirmCancelAppointment(null)}
        roundedClass="rounded-[32px]"
      >
        {confirmCancelAppointment && (
          <>
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
                    Confirme os dados antes de
                    <br />
                    desmarcar este atendimento
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmCancelAppointment(null)}
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
                    {confirmCancelAppointment.serviceName}
                  </h4>
                </div>
                <span className="text-[17px] font-extrabold text-[#111111] shrink-0">
                  {formatBRL(confirmCancelAppointment.price)}
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
                      {confirmCancelAppointment.date
                        .split("-")
                        .reverse()
                        .join("/")}{" "}
                      às {confirmCancelAppointment.time}
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
                      {confirmCancelAppointment.clientName} •{" "}
                      {confirmCancelAppointment.clientPhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                disabled={
                  busyAction === `cancel-${confirmCancelAppointment.id}`
                }
                onClick={() =>
                  runAdminAction(
                    `cancel-${confirmCancelAppointment.id}`,
                    {
                      action: "update_appointment_status",
                      id: confirmCancelAppointment.id,
                      status: "cancelado",
                      cancelReason: "Desmarcado no painel executivo",
                    },
                    () => {
                      setConfirmCancelAppointment(null);
                      setSelectedAppointment(null);
                    }
                  )
                }
                className="w-full py-4 px-5 rounded-[18px] bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md smooth-press disabled:opacity-60 cursor-pointer"
              >
                {busyAction === `cancel-${confirmCancelAppointment.id}` ? (
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
                onClick={() => setConfirmCancelAppointment(null)}
                className="w-full py-2 text-center text-[13px] font-semibold text-[#57534E] hover:text-[#111111] smooth-press cursor-pointer"
              >
                Voltar sem desmarcar
              </button>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* ==================== MODAL: + AGENDAR (ENCAIXE MANUAL) ==================== */}
      <AnimatedModal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
      >
        <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#111111]">
                Novo Agendamento Manual
              </h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setShowManualModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  Procedimento
                </label>
                <select
                  value={manualAppt.serviceId}
                  onChange={(e) =>
                    setManualAppt({ ...manualAppt, serviceId: e.target.value })
                  }
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs font-bold text-[#111111]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatBRL(s.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                    Data
                  </label>
                  <DatePicker
                    variant="input"
                    title="Data do Agendamento"
                    value={manualAppt.date}
                    onChange={(d) => setManualAppt({ ...manualAppt, date: d })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={manualAppt.time}
                    onChange={(e) =>
                      setManualAppt({ ...manualAppt, time: e.target.value })
                    }
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  Nome da Cliente
                </label>
                <input
                  type="text"
                  value={manualAppt.clientName}
                  onChange={(e) =>
                    setManualAppt({ ...manualAppt, clientName: e.target.value })
                  }
                  placeholder="Ex: Juliana Rossi"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  WhatsApp com DDD
                </label>
                <input
                  type="tel"
                  value={manualAppt.clientPhone}
                  onChange={(e) =>
                    setManualAppt({
                      ...manualAppt,
                      clientPhone: e.target.value,
                    })
                  }
                  placeholder="Ex: 11988887777"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                  Endereço (Atendimento a Domicílio)
                </label>
                <input
                  type="text"
                  value={manualAppt.clientAddress}
                  onChange={(e) =>
                    setManualAppt({
                      ...manualAppt,
                      clientAddress: e.target.value,
                    })
                  }
                  placeholder="Rua, número, complemento e bairro"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs font-medium"
                />
              </div>

              <button
                type="button"
                disabled={busyAction === "manual-appt"}
                onClick={() =>
                  runAdminAction(
                    "manual-appt",
                    {
                      action: "create_manual_appointment",
                      ...manualAppt,
                    },
                    () => {
                      setShowManualModal(false);
                      setAgendaDate(manualAppt.date);
                    }
                  )
                }
                className="w-full py-4 rounded-[18px] bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md smooth-press cursor-pointer"
              >
                {busyAction === "manual-appt" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>Confirmar Agendamento</span>
              </button>
            </div>
      </AnimatedModal>

      {/* ==================== MODAL: NOTIFICAÇÕES & AVISOS WHATSAPP ==================== */}
      <AnimatedModal
        open={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        cardClassName="max-h-[50vh] flex flex-col"
      >
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-[#111111]">
              Notificações Recentes
            </h3>
            <p className="text-[11px] font-semibold text-[#78716C]">
              Toque em uma notificação para abrir o atendimento
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setShowNotificationsModal(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:bg-black/5 smooth-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {whatsappEvents.length === 0 ? (
          <p className="text-xs text-[#78716C] text-center py-6">
            Nenhuma notificação recente.
          </p>
        ) : (
          <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1">
            {whatsappEvents.map((ev, idx) => {
              const isRead = Boolean(ev.read);
              return (
                <div
                  key={ev.id}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  onClick={() => handleOpenNotificationItem(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleOpenNotificationItem(ev);
                  }}
                  className={`p-3.5 rounded-2xl bg-[#FAF8F5] border flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 animate-card smooth-card ${
                    isRead
                      ? "opacity-55 border-[#EFECE6]"
                      : "opacity-100 border-[#E5E0D8] shadow-2xs"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
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
                    <p className="text-xs font-extrabold text-[#111111] truncate mt-1">
                      {ev.clientName} — {ev.serviceName}
                    </p>
                    <p className="text-[11px] text-[#78716C]">
                      {ev.date.split("-").reverse().join("/")} às {ev.time}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWhatsAppClient(
                        ev.clientPhone,
                        `Olá ${ev.clientName}! ✨ Recebi a atualização do seu horário de ${ev.serviceName}.`
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-[#141519] text-white text-xs font-bold shrink-0 smooth-press cursor-pointer"
                  >
                    Chamar
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F0ECE6] shrink-0">
          <button
            type="button"
            disabled={whatsappEvents.length === 0}
            onClick={() =>
              runAdminAction("clear-events", {
                action: "clear_whatsapp_events",
              })
            }
            className="py-2.5 px-3 rounded-xl bg-[#F4F1EC] hover:bg-[#E7E2DA] text-[#78716C] hover:text-[#111111] text-xs font-bold smooth-press disabled:opacity-40 cursor-pointer"
          >
            Limpar notificações
          </button>

          <button
            type="button"
            onClick={() => {
              setShowNotificationsModal(false);
              router.push("/admin/notificacoes");
            }}
            className="py-2.5 px-3 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white text-xs font-bold smooth-press cursor-pointer"
          >
            Ver todas
          </button>
        </div>
      </AnimatedModal>
    </div>
  );
}
