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
  MapPin,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Mail,
  Send,
  Server,
  Users,
  Activity,
  Database,
} from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { AnimatedModal } from "@/components/AnimatedModal";
import { ScrollArea } from "@/components/ScrollArea";

interface PasskeyItem {
  id: string;
  name: string;
  createdAt: string;
  deviceType?: string;
  backedUp?: boolean;
}

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
  adminEmail?: string;
  superAdminUsername?: string;
  superAdminPassword?: string;
  superAdminEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  requirePasskey2FA?: boolean;
  adminRequirePasskey2FA?: boolean;
  superAdminRequire2FA?: boolean;
  passkeys?: PasskeyItem[];
  adminPasskeys?: PasskeyItem[];
  superAdminPasskeys?: PasskeyItem[];
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

function AdminThumbImage({
  src,
  alt,
  className = "w-12 h-12 rounded-2xl",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={`${className} overflow-hidden shrink-0 bg-[#F4F1EC] relative`}
    >
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-[#E8E2D9] animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
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
  const [userRole, setUserRole] = useState<"admin" | "superadmin">("admin");
  const [superTab, setSuperTab] = useState<
    "visao_geral" | "contas" | "smtp_seguranca" | "sistema"
  >("visao_geral");
  const [superViewStudioMode, setSuperViewStudioMode] = useState(false);

  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [hasPasskeysConfigured, setHasPasskeysConfigured] = useState(false);
  const [awaitingPasskey2FA, setAwaitingPasskey2FA] = useState(false);
  const [pending2FARole, setPending2FARole] = useState<
    "admin" | "superadmin" | undefined
  >(undefined);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [hasRecoveryEmailConfigured, setHasRecoveryEmailConfigured] =
    useState(false);
  const [maskedRecoveryEmail, setMaskedRecoveryEmail] = useState("");
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [recoveryStage, setRecoveryStage] = useState<
    "idle" | "request" | "verify"
  >("idle");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryDisable2FA, setRecoveryDisable2FA] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [showSmtpAdvanced, setShowSmtpAdvanced] = useState(false);
  const [loginAnimStage, setLoginAnimStage] = useState<
    "idle" | "fading-form" | "welcome" | "exiting"
  >("idle");
  const [tickAnimKey, setTickAnimKey] = useState(0);
  const [welcomeDisplayName, setWelcomeDisplayName] = useState("");

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
  const [manualAddressStreetQuery, setManualAddressStreetQuery] =
    useState<string>("");
  const [manualAddressNumber, setManualAddressNumber] = useState<string>("");
  const [manualAddressComplement, setManualAddressComplement] =
    useState<string>("");
  const [manualAddressVerifiedBase, setManualAddressVerifiedBase] = useState<{
    street: string;
    suburb: string;
    city: string;
    state: string;
    postcode: string;
    formatted: string;
  } | null>(null);
  const [manualGeoSuggestions, setManualGeoSuggestions] = useState<
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
  const [loadingManualGeo, setLoadingManualGeo] = useState<boolean>(false);
  const [showManualGeoDropdown, setShowManualGeoDropdown] =
    useState<boolean>(false);

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
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setAuthenticated(false);
        setHasPasskeysConfigured(Boolean(data?.hasPasskeys));
        setHasRecoveryEmailConfigured(Boolean(data?.hasRecoveryEmail));
        setMaskedRecoveryEmail(String(data?.maskedRecoveryEmail || ""));
        return;
      }
      if (data.authenticated) {
        if (!deferAuthSwitch) {
          setAuthenticated(true);
        }
        setUserRole(data.role === "superadmin" ? "superadmin" : "admin");
        setConfig(data.config);
        setHasPasskeysConfigured(
          (Array.isArray(data.config?.adminPasskeys) &&
            data.config.adminPasskeys.length > 0) ||
            (Array.isArray(data.config?.superAdminPasskeys) &&
              data.config.superAdminPasskeys.length > 0)
        );
        setHasRecoveryEmailConfigured(
          Boolean(data.config?.smtpUser && data.config?.smtpPass)
        );
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

  // Keep manualAppt.clientAddress synchronized whenever Geoapify street, number, or complement changes
  useEffect(() => {
    if (!manualAddressVerifiedBase && !manualAddressStreetQuery.trim()) {
      setManualAppt((prev) => ({ ...prev, clientAddress: "" }));
      return;
    }

    const numPart = manualAddressNumber.trim() || "S/N";
    const streetName = manualAddressVerifiedBase
      ? manualAddressVerifiedBase.street || manualAddressVerifiedBase.formatted
      : manualAddressStreetQuery.trim();
    const areaParts = manualAddressVerifiedBase
      ? [
          manualAddressVerifiedBase.suburb,
          manualAddressVerifiedBase.city && manualAddressVerifiedBase.state
            ? `${manualAddressVerifiedBase.city} - ${manualAddressVerifiedBase.state}`
            : manualAddressVerifiedBase.city || manualAddressVerifiedBase.state,
          manualAddressVerifiedBase.postcode,
        ].filter(Boolean)
      : [];

    let full = manualAddressNumber.trim()
      ? `${streetName}, ${numPart}`
      : manualAddressVerifiedBase
      ? `${streetName}, ${numPart}`
      : streetName;
    if (areaParts.length > 0) {
      full += ` - ${areaParts.join(", ")}`;
    }
    if (manualAddressComplement.trim()) {
      full += ` (${manualAddressComplement.trim()})`;
    }
    setManualAppt((prev) => ({ ...prev, clientAddress: full }));
  }, [
    manualAddressVerifiedBase,
    manualAddressStreetQuery,
    manualAddressNumber,
    manualAddressComplement,
  ]);

  // Debounced Geoapify address autocomplete for manual appointment modal
  useEffect(() => {
    const q = manualAddressStreetQuery.trim();
    if (
      manualAddressVerifiedBase &&
      q ===
        (manualAddressVerifiedBase.street ||
          manualAddressVerifiedBase.formatted)
    ) {
      setManualGeoSuggestions([]);
      setLoadingManualGeo(false);
      return;
    }
    if (q.length < 3) {
      setManualGeoSuggestions([]);
      setLoadingManualGeo(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoadingManualGeo(true);
        const apiKey =
          process.env.NEXT_PUBLIC_GEOAPIFY_KEY ||
          "3b4d69632b19443ba05956f3a749ebdb";
        // Scoped strictly to Vitória da Conquista - BA (25km radius around city center -14.8619, -40.8442)
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          q
        )}&lang=pt&filter=circle:-40.8442,-14.8619,25000&bias=proximity:-40.8442,-14.8619&limit=6&format=json&apiKey=${apiKey}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          setManualGeoSuggestions([]);
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
          .filter((item: { line1: string }) => Boolean(item.line1));

        setManualGeoSuggestions(mapped);
      } catch {
        // ignore abort errors
      } finally {
        setLoadingManualGeo(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [manualAddressStreetQuery, manualAddressVerifiedBase]);

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

  const base64UrlToUint8Array = (base64Url: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
    const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window
      .btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  };

  const runSuccessLoginTransition = () => {
    const dataPromise = loadAdminData(true);
    setLoginLoading(false);
    setPasskeyLoading(false);
    setAwaitingPasskey2FA(false);
    setLoginAnimStage("fading-form");

    setTimeout(() => {
      setTickAnimKey((k) => k + 1);
      setLoginAnimStage("welcome");

      setTimeout(() => {
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
  };

  const handlePasskeyLogin = async (roleHint?: "admin" | "superadmin") => {
    setLoginError("");
    if (
      typeof window === "undefined" ||
      !window.PublicKeyCredential ||
      !navigator.credentials
    ) {
      const isInsecureIp =
        typeof window !== "undefined" &&
        (!window.isSecureContext ||
          /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname));
      setLoginError(
        isInsecureIp
          ? "No iPhone/celular, o FaceID (Passkey) exige conexão HTTPS com domínio (não funciona acessando por IP http://192.168...)."
          : "Seu navegador ou dispositivo não suporta Passkeys (WebAuthn)."
      );
      return;
    }

    try {
      setPasskeyLoading(true);
      const optRes = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "passkey_login_options",
          role: roleHint || pending2FARole,
        }),
      });
      const optData = await optRes.json();
      if (!optRes.ok) {
        setLoginError(
          optData.error || "Não foi possível iniciar login com Passkey."
        );
        setPasskeyLoading(false);
        return;
      }

      const options = optData.options;
      const publicKeyRequest: PublicKeyCredentialRequestOptions = {
        challenge: base64UrlToUint8Array(options.challenge)
          .buffer as ArrayBuffer,
        rpId: options.rpId,
        timeout: options.timeout || 60000,
        userVerification: options.userVerification || "preferred",
        allowCredentials: Array.isArray(options.allowCredentials)
          ? options.allowCredentials.map(
              (c: { id: string; transports?: AuthenticatorTransport[] }) => ({
                type: "public-key" as const,
                id: base64UrlToUint8Array(c.id).buffer as ArrayBuffer,
                transports: c.transports,
              })
            )
          : undefined,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyRequest,
      })) as PublicKeyCredential | null;

      if (!assertion) {
        setLoginError("Autenticação com Passkey cancelada.");
        setPasskeyLoading(false);
        return;
      }

      const assertionRes =
        assertion.response as AuthenticatorAssertionResponse;
      const credentialPayload = {
        id: assertion.id,
        rawId: arrayBufferToBase64Url(assertion.rawId),
        type: assertion.type,
        authenticatorAttachment: (
          assertion as PublicKeyCredential & {
            authenticatorAttachment?: string;
          }
        ).authenticatorAttachment,
        clientExtensionResults: assertion.getClientExtensionResults(),
        response: {
          clientDataJSON: arrayBufferToBase64Url(assertionRes.clientDataJSON),
          authenticatorData: arrayBufferToBase64Url(
            assertionRes.authenticatorData
          ),
          signature: arrayBufferToBase64Url(assertionRes.signature),
          userHandle: assertionRes.userHandle
            ? arrayBufferToBase64Url(assertionRes.userHandle)
            : undefined,
        },
      };

      const verifyRes = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "passkey_login_verify",
          credential: credentialPayload,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setLoginError(
          verifyData.error || "Falha ao validar Passkey / Biometria."
        );
        setPasskeyLoading(false);
        return;
      }

      if (verifyData.role === "superadmin" || verifyData.role === "admin") {
        setUserRole(verifyData.role);
      }
      if (verifyData.displayName || verifyData.username) {
        setWelcomeDisplayName(
          String(verifyData.displayName || verifyData.username).split(" ")[0]
        );
      }
      runSuccessLoginTransition();
    } catch (err: unknown) {
      const errName = (err as { name?: string })?.name;
      if (errName === "NotAllowedError") {
        setLoginError("Leitura biométrica cancelada ou não autorizada.");
      } else {
        setLoginError("Não foi possível autenticar com Passkey.");
      }
      setPasskeyLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    if (
      typeof window === "undefined" ||
      !window.PublicKeyCredential ||
      !navigator.credentials
    ) {
      const isInsecureIp =
        typeof window !== "undefined" &&
        (!window.isSecureContext ||
          /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname));
      alert(
        isInsecureIp
          ? "No iPhone/celular, a Apple exige conexão HTTPS com um domínio (ex: Vercel, ngrok ou túnel Cloudflare) para liberar o FaceID. Acessando via IP local (http://192.168...) o Safari bloqueia o FaceID."
          : "Seu navegador ou dispositivo não suporta Passkeys (WebAuthn)."
      );
      return;
    }

    try {
      setRegisteringPasskey(true);
      const optRes = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "passkey_register_options" }),
      });
      const optData = await optRes.json();
      if (!optRes.ok) {
        alert(optData.error || "Erro ao gerar desafio de Passkey.");
        return;
      }

      const options = optData.options;
      const publicKeyCreate: PublicKeyCredentialCreationOptions = {
        rp: options.rp,
        user: {
          id: base64UrlToUint8Array(options.user.id).buffer as ArrayBuffer,
          name: options.user.name,
          displayName: options.user.displayName,
        },
        challenge: base64UrlToUint8Array(options.challenge)
          .buffer as ArrayBuffer,
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout || 60000,
        attestation: options.attestation || "none",
        authenticatorSelection: options.authenticatorSelection,
        excludeCredentials: Array.isArray(options.excludeCredentials)
          ? options.excludeCredentials.map(
              (c: { id: string; transports?: AuthenticatorTransport[] }) => ({
                type: "public-key" as const,
                id: base64UrlToUint8Array(c.id).buffer as ArrayBuffer,
                transports: c.transports,
              })
            )
          : undefined,
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCreate,
      })) as PublicKeyCredential | null;

      if (!credential) {
        return;
      }

      const attestationRes =
        credential.response as AuthenticatorAttestationResponse & {
          getTransports?: () => string[];
        };
      const credentialPayload = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        type: credential.type,
        authenticatorAttachment: (
          credential as PublicKeyCredential & {
            authenticatorAttachment?: string;
          }
        ).authenticatorAttachment,
        clientExtensionResults: credential.getClientExtensionResults(),
        response: {
          clientDataJSON: arrayBufferToBase64Url(attestationRes.clientDataJSON),
          attestationObject: arrayBufferToBase64Url(
            attestationRes.attestationObject
          ),
          transports:
            typeof attestationRes.getTransports === "function"
              ? attestationRes.getTransports()
              : undefined,
        },
      };

      const defaultDeviceLabel = /iPhone|iPad/i.test(navigator.userAgent)
        ? "iPhone / FaceID"
        : /Android/i.test(navigator.userAgent)
        ? "Android / Biometria"
        : /Mac/i.test(navigator.userAgent)
        ? "Mac / TouchID"
        : "Este Dispositivo";

      const verifyRes = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "passkey_register_verify",
          credential: credentialPayload,
          deviceName: newPasskeyName.trim() || defaultDeviceLabel,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        alert(verifyData.error || "Falha ao salvar Passkey.");
        return;
      }

      setNewPasskeyName("");
      await loadAdminData();
      showToast(verifyData.message || "Passkey cadastrada com sucesso!");
    } catch (err: unknown) {
      const errName = (err as { name?: string })?.name;
      if (errName !== "NotAllowedError") {
        alert("Não foi possível concluir o cadastro da Passkey.");
      }
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleRequestRecoveryEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    setRecoveryMessage("");
    const idToRecover = (recoveryIdentifier || username || "").trim();
    if (!idToRecover) {
      setLoginError(
        "Informe o e-mail ou nome de usuário cadastrado na sua conta."
      );
      return;
    }
    try {
      setRecoveryLoading(true);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_password_recovery",
          identifier: idToRecover,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(
          data.error || "Não foi possível enviar o código de recuperação."
        );
        return;
      }
      if (data.maskedEmail) {
        setMaskedRecoveryEmail(data.maskedEmail);
      }
      setRecoveryMessage(
        data.message || "Código de 6 dígitos enviado para o seu e-mail!"
      );
      setRecoveryStage("verify");
    } catch {
      setLoginError("Erro de conexão ao solicitar código por e-mail.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      setRecoveryLoading(true);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_password_recovery",
          code: recoveryCode.trim(),
          newPassword: recoveryNewPassword.trim(),
          disablePasskey2FA: recoveryDisable2FA,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Código inválido ou expirado.");
        return;
      }

      if (data.role === "superadmin" || data.role === "admin") {
        setUserRole(data.role);
      }
      if (data.displayName || data.username) {
        setWelcomeDisplayName(
          String(data.displayName || data.username).split(" ")[0]
        );
      }
      setRecoveryStage("idle");
      setRecoveryCode("");
      setRecoveryNewPassword("");
      setRecoveryMessage("");
      runSuccessLoginTransition();
    } catch {
      setLoginError("Erro de conexão ao redefinir senha.");
    } finally {
      setRecoveryLoading(false);
    }
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

      if (data.role === "superadmin" || data.role === "admin") {
        setUserRole(data.role);
      }
      if (data.displayName || data.username) {
        setWelcomeDisplayName(
          String(data.displayName || data.username).split(" ")[0]
        );
      }

      if (data.require2FA) {
        setLoginLoading(false);
        setPending2FARole(data.role);
        setAwaitingPasskey2FA(true);
        // Automatically trigger WebAuthn biometric prompt
        handlePasskeyLogin(data.role);
        return;
      }

      runSuccessLoginTransition();
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
      <div className="min-h-dvh bg-[#FAF8F5] text-[#111111] font-sans">
        <div className="max-w-[440px] mx-auto min-h-dvh flex flex-col bg-[#FAF8F5] relative pb-22 animate-pulse">
          {/* Executive Header Skeleton */}
          <header className="px-5 pt-5 pb-4 border-b border-[#EFECE6] flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded-lg bg-[#E8E2D9]" />
              <div className="h-2.5 w-24 rounded bg-[#EDE8E0]" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#EDE8E0]" />
              <div className="w-10 h-10 rounded-full bg-[#EDE8E0]" />
              <div className="w-10 h-10 rounded-full bg-[#E8E2D9]" />
            </div>
          </header>

          <main className="px-5 pt-5 flex-1 flex flex-col">
            {/* Greeting & Date Skeleton */}
            <div className="space-y-2">
              <div className="h-3.5 w-24 rounded bg-[#EDE8E0]" />
              <div className="h-7 w-56 rounded-lg bg-[#E8E2D9]" />
            </div>

            {/* Resumo de Hoje Card Skeleton */}
            <div className="mt-6 p-4 rounded-[26px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <div className="h-3 w-28 rounded bg-[#EDE8E0]" />
                <div className="h-3 w-24 rounded bg-[#EDE8E0]" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-[20px] bg-[#E8E2D9] min-h-[108px] flex flex-col justify-between"
                  >
                    <div className="h-2.5 w-14 rounded bg-[#D6CFC5]" />
                    <div className="h-5 w-16 rounded bg-[#D6CFC5]" />
                    <div className="h-2.5 w-16 rounded bg-[#D6CFC5]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda Completa Skeleton */}
            <div className="mt-6 flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-36 rounded-lg bg-[#E8E2D9]" />
                <div className="h-8 w-28 rounded-full bg-white border border-[#E5E0D8]" />
              </div>
              <div className="space-y-2.5 flex-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-[22px] bg-white flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-4 w-11 rounded bg-[#E8E2D9]" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-36 rounded bg-[#E8E2D9]" />
                        <div className="h-3 w-44 rounded bg-[#F3EFEA]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-1">
              <div className="h-[52px] rounded-[20px] bg-[#E2DDD5]" />
              <div className="h-[52px] rounded-[20px] bg-white border border-[#E5E0D8]" />
            </div>
          </main>

          {/* Bottom Nav Skeleton */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#EFECE6]">
            <div className="max-w-[440px] mx-auto px-6 pt-2.5 pb-3.5 flex items-center justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 py-1.5 px-3">
                  <div className="w-5 h-5 rounded bg-[#E8E2D9]" />
                  <div className="h-2.5 w-12 rounded bg-[#EDE8E0]" />
                </div>
              ))}
            </div>
          </nav>
        </div>
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
            {/* Top-left back arrow button */}
            <button
              type="button"
              onClick={() => router.push("/")}
              aria-label="Voltar para a Home"
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] flex items-center justify-center text-[#111111] smooth-press cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center">
                {recoveryStage !== "idle" ? (
                  <Mail className="w-6 h-6 text-[#111111]" />
                ) : awaitingPasskey2FA ? (
                  <Fingerprint className="w-6 h-6 text-[#111111]" />
                ) : (
                  <Lock className="w-6 h-6 text-[#111111]" />
                )}
              </div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C]">
                {recoveryStage !== "idle"
                  ? "RECUPERAÇÃO DE ACESSO"
                  : awaitingPasskey2FA
                  ? "VERIFICAÇÃO EM 2 ETAPAS (2FA)"
                  : "PAINEL EXECUTIVO"}
              </span>
              <h1 className="text-xl font-extrabold text-[#111111]">
                {recoveryStage !== "idle"
                  ? "Redefinir Senha por E-mail"
                  : awaitingPasskey2FA
                  ? "Confirme sua Passkey"
                  : "Isabele Lash Designer"}
              </h1>
              <p className="text-xs text-[#78716C]">
                {recoveryStage === "request"
                  ? "Digite o e-mail ou nome de usuário da sua conta para receber o código de 6 dígitos."
                  : recoveryStage === "verify"
                  ? `Digite o código de 6 dígitos enviado para ${maskedRecoveryEmail || "seu e-mail"} e escolha sua nova senha.`
                  : awaitingPasskey2FA
                  ? "Use seu FaceID, TouchID ou Biometria cadastrada para liberar o painel."
                  : "Entre com seu usuário e senha ou use sua Passkey (FaceID / Biometria)."}
              </p>
            </div>

            {recoveryStage === "request" ? (
              <form
                onSubmit={handleRequestRecoveryEmail}
                className="space-y-3.5"
              >
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                    Seu E-mail ou Usuário Cadastrado
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="ex: seuemail@gmail.com ou usuário"
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
                  disabled={recoveryLoading || isFormHidden}
                  className="w-full py-4 rounded-[18px] bg-[#0F1115] hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md smooth-press cursor-pointer"
                >
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Código por E-mail</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryStage("idle");
                    setLoginError("");
                  }}
                  className="w-full py-2 text-xs font-bold text-[#78716C] hover:text-[#111111] cursor-pointer"
                >
                  Voltar ao login
                </button>
              </form>
            ) : recoveryStage === "verify" ? (
              <form onSubmit={handleVerifyRecoveryCode} className="space-y-3.5">
                {recoveryMessage && (
                  <p className="text-xs text-[#059669] bg-[#10B981]/10 border border-[#10B981]/30 p-3 rounded-xl text-center font-semibold animate-expand">
                    {recoveryMessage}
                  </p>
                )}

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                    Código de 6 Dígitos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={recoveryCode}
                    onChange={(e) =>
                      setRecoveryCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="000000"
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl px-4 py-3 text-center text-base font-extrabold tracking-[0.3em] text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={recoveryNewPassword}
                    onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl px-4 py-3 text-sm font-medium text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>

                {hasPasskeysConfigured && (
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#111111] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recoveryDisable2FA}
                      onChange={(e) => setRecoveryDisable2FA(e.target.checked)}
                      className="rounded border-[#E5E0D8]"
                    />
                    <span>Desativar exigência de Passkey 2FA ao entrar</span>
                  </label>
                )}

                {loginError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl text-center font-semibold animate-expand">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={recoveryLoading || isFormHidden}
                  className="w-full py-4 rounded-[18px] bg-[#0F1115] hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md smooth-press cursor-pointer"
                >
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando e Entrando...</span>
                    </>
                  ) : (
                    <span>Confirmar Nova Senha e Entrar</span>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={recoveryLoading}
                    onClick={() => handleRequestRecoveryEmail()}
                    className="text-xs font-bold text-[#111111] hover:underline cursor-pointer"
                  >
                    Reenviar código
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStage("idle");
                      setLoginError("");
                      setRecoveryMessage("");
                    }}
                    className="text-xs font-bold text-[#78716C] hover:text-[#111111] cursor-pointer"
                  >
                    Voltar ao login
                  </button>
                </div>
              </form>
            ) : awaitingPasskey2FA ? (
              <div className="space-y-3.5">
                {loginError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl text-center font-semibold animate-expand">
                    {loginError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={passkeyLoading || isFormHidden}
                  onClick={() => handlePasskeyLogin()}
                  className="w-full py-4 rounded-[18px] bg-[#0F1115] hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md smooth-press cursor-pointer"
                >
                  {passkeyLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Aguardando Biometria...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>Confirmar com Passkey / FaceID</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingPasskey2FA(false);
                      setLoginError("");
                    }}
                    className="text-xs font-bold text-[#78716C] hover:text-[#111111] cursor-pointer"
                  >
                    Voltar ao login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingPasskey2FA(false);
                      setLoginError("");
                      setRecoveryDisable2FA(true);
                      if (username.trim()) {
                        setRecoveryIdentifier(username.trim());
                      }
                      setRecoveryStage("request");
                    }}
                    className="text-xs font-bold text-[#111111] hover:underline cursor-pointer"
                  >
                    Perdi minha Passkey (E-mail)
                  </button>
                </div>
              </div>
            ) : (
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginError("");
                        if (username.trim()) {
                          setRecoveryIdentifier(username.trim());
                        }
                        setRecoveryStage("request");
                      }}
                      className="text-[11px] font-bold text-[#78716C] hover:text-[#111111] hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
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
                  disabled={loginLoading || passkeyLoading || isFormHidden}
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

                {hasPasskeysConfigured && (
                  <button
                    type="button"
                    disabled={loginLoading || passkeyLoading || isFormHidden}
                    onClick={() => handlePasskeyLogin()}
                    className="w-full py-3.5 rounded-[18px] bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-[#111111] font-bold text-xs flex items-center justify-center gap-2 smooth-press cursor-pointer"
                  >
                    {passkeyLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verificando Passkey...</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 text-[#111111]" />
                        <span>Entrar com Passkey (FaceID / Biometria)</span>
                      </>
                    )}
                  </button>
                )}
              </form>
            )}
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
                Bem vindo,{" "}
                {welcomeDisplayName ||
                  (userRole === "superadmin"
                    ? config?.superAdminUsername || username || "fr4nce"
                    : (
                        config?.professionalName ||
                        config?.adminUsername ||
                        username ||
                        "Admin"
                      ).split(" ")[0])}
                !
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

  // ==================== SUPERADMIN EXCLUSIVE SYSTEM DASHBOARD ====================
  if (userRole === "superadmin" && !superViewStudioMode && config) {
    const smtpReady = Boolean(config.smtpUser && config.smtpPass);
    const superPasskeys = Array.isArray(config.superAdminPasskeys)
      ? config.superAdminPasskeys
      : [];
    const profPasskeys = Array.isArray(config.adminPasskeys)
      ? config.adminPasskeys
      : [];

    return (
      <div className="min-h-dvh bg-[#FAF8F5] text-[#111111] font-sans">
        {toast && (
          <div className="fixed bottom-24 left-1/2 z-50 bg-[#0F1115] text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap w-max max-w-[92vw] animate-toast">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        <div className="max-w-[440px] mx-auto min-h-dvh flex flex-col bg-[#FAF8F5] relative pb-24">
          {/* Header SuperAdmin (Limpo e alinhado ao padrão executivo) */}
          <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md px-5 pt-5 pb-4 border-b border-[#EFECE6] flex items-center justify-between animate-card">
            <div>
              <h1 className="text-[17px] font-extrabold text-[#111111] leading-tight">
                {shortStudioTitle || "Isabele Lash"}
              </h1>
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C] mt-0.5">
                SUPERADMIN • @{config.superAdminUsername || "fr4nce"}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSuperViewStudioMode(true)}
                aria-label="Abrir Painel da Profissional"
                title="Abrir Painel da Profissional"
                className="w-10 h-10 rounded-full bg-[#F4F1EC] hover:bg-[#EAE5DD] flex items-center justify-center text-[#111111] smooth-press cursor-pointer"
              >
                <Eye className="w-[18px] h-[18px] stroke-[2]" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sair"
                title="Sair"
                className="w-10 h-10 rounded-full bg-[#F4F1EC] hover:bg-red-50 text-[#111111] hover:text-red-600 flex items-center justify-center smooth-press cursor-pointer"
              >
                <LogOut className="w-[18px] h-[18px] stroke-[2]" />
              </button>
            </div>
          </header>

          {/* ==================== SUPER TAB 1: VISÃO GERAL & CONTROLE ==================== */}
          {superTab === "visao_geral" && (
            <main className="px-5 pt-5 space-y-4 flex-1">
              <div className="animate-card">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C]">
                  MONITORAMENTO & INFRAESTRUTURA
                </span>
                <h2 className="text-[22px] font-extrabold text-[#111111] tracking-tight">
                  Status do Sistema
                </h2>
              </div>

              {/* Status Cards Grid */}
              <section className="grid grid-cols-2 gap-2.5 animate-card">
                <div className="p-4 rounded-[22px] bg-[#141519] text-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                      PROVEDOR SMTP
                    </span>
                    <Server className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <p className="text-base font-extrabold text-white">
                    {smtpReady ? "Ativo & Online" : "Pendente"}
                  </p>
                  <p className="text-[10px] text-[#A1A1AA] truncate">
                    {config.smtpUser || "Não configurado"}
                  </p>
                </div>

                <div className="p-4 rounded-[22px] bg-white border border-[#EFECE6] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                      CONTA ADMIN (LASH)
                    </span>
                    <Users className="w-4 h-4 text-[#111111]" />
                  </div>
                  <p className="text-base font-extrabold text-[#111111] truncate">
                    @{config.adminUsername}
                  </p>
                  <p className="text-[10px] text-[#78716C] truncate">
                    {config.adminEmail || "Sem e-mail de recuperação"}
                  </p>
                </div>

                <div className="p-4 rounded-[22px] bg-white border border-[#EFECE6] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                      AGENDAMENTOS
                    </span>
                    <Calendar className="w-4 h-4 text-[#111111]" />
                  </div>
                  <p className="text-lg font-extrabold text-[#111111]">
                    {appointments.length}
                  </p>
                  <p className="text-[10px] text-[#78716C]">
                    {
                      appointments.filter((a) => a.status === "agendado")
                        .length
                    }{" "}
                    ativos •{" "}
                    {
                      appointments.filter((a) => a.status === "concluido")
                        .length
                    }{" "}
                    concluídos
                  </p>
                </div>

                <div className="p-4 rounded-[22px] bg-white border border-[#EFECE6] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                      PASSKEYS (2FA)
                    </span>
                    <Fingerprint className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <p className="text-lg font-extrabold text-[#111111]">
                    {superPasskeys.length + profPasskeys.length}
                  </p>
                  <p className="text-[10px] text-[#78716C]">
                    {superPasskeys.length} Gestor • {profPasskeys.length} Admin
                  </p>
                </div>
              </section>

              {/* Resumo Rápido das Contas e Roteamento de Recuperação */}
              <section className="p-5 rounded-[24px] bg-white border border-[#EFECE6] space-y-3.5 animate-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#111111]">
                    Roteamento de Recuperação de Senha
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] text-[10px] font-extrabold">
                    Automático
                  </span>
                </div>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  O seu e-mail SMTP (<b>{config.smtpUser || "não definido"}</b>)
                  atua exclusivamente como <b>provedor de disparo</b>. Cada
                  usuário recebe o código no seu próprio e-mail cadastrado:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#78716C] block">
                        PROFISSIONAL (ROLE: ADMIN)
                      </span>
                      <p className="font-bold text-[#111111]">
                        Usuário: {config.adminUsername}
                      </p>
                      <p className="text-[11px] text-[#78716C]">
                        Recebe em:{" "}
                        <b className="text-[#111111]">
                          {config.adminEmail || "Não cadastrado!"}
                        </b>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuperTab("contas")}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] font-bold text-[11px] smooth-press cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#78716C] block">
                        GESTOR DO SISTEMA (ROLE: SUPERADMIN)
                      </span>
                      <p className="font-bold text-[#111111]">
                        Usuário: {config.superAdminUsername || "fr4nce"}
                      </p>
                      <p className="text-[11px] text-[#78716C]">
                        Recebe em:{" "}
                        <b className="text-[#111111]">
                          {config.superAdminEmail ||
                            "guilhermefrance9@gmail.com"}
                        </b>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuperTab("contas")}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] font-bold text-[11px] smooth-press cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </section>

              {/* Atalhos Rápidos de Administração */}
              <div className="grid grid-cols-2 gap-2.5 animate-card">
                <button
                  type="button"
                  onClick={() => setSuperTab("smtp_seguranca")}
                  className="p-4 rounded-[22px] bg-white border border-[#EFECE6] hover:bg-[#F4F1EC] text-left space-y-1 smooth-press cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-[#111111]" />
                  <p className="text-xs font-extrabold text-[#111111]">
                    Configurar SMTP
                  </p>
                  <p className="text-[10px] text-[#78716C]">
                    Servidor de envio e 2FA
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSuperViewStudioMode(true)}
                  className="p-4 rounded-[22px] bg-white border border-[#EFECE6] hover:bg-[#F4F1EC] text-left space-y-1 smooth-press cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#111111]" />
                  <p className="text-xs font-extrabold text-[#111111]">
                    Ver Painel da Lash
                  </p>
                  <p className="text-[10px] text-[#78716C]">
                    Inspecionar agenda e bio
                  </p>
                </button>
              </div>
            </main>
          )}

          {/* ==================== SUPER TAB 2: CONTAS & ACESSOS (ADMIN + SUPERADMIN) ==================== */}
          {superTab === "contas" && (
            <main className="px-5 pt-5 space-y-4 flex-1">
              <div className="animate-card">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C]">
                  CONTROLE DE USUÁRIOS & ROLES
                </span>
                <h2 className="text-[22px] font-extrabold text-[#111111] tracking-tight">
                  Contas do Sistema
                </h2>
              </div>

              {/* Card 1: Conta da Profissional (Admin) */}
              <section className="p-5 rounded-[24px] bg-white border border-[#EFECE6] space-y-3.5 animate-card">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9D5C6D]">
                      ROLE: ADMIN (PROFISSIONAL)
                    </span>
                    <h3 className="text-sm font-extrabold text-[#111111]">
                      Acesso da Profissional ({config.professionalName})
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F4F1EC] text-[#111111] text-[10px] font-bold">
                    @{config.adminUsername}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                      Usuário (Admin)
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={config.adminUsername || ""}
                      onChange={(e) =>
                        setConfig({ ...config, adminUsername: e.target.value })
                      }
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                      Senha (Admin)
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={config.adminPassword || ""}
                      onChange={(e) =>
                        setConfig({ ...config, adminPassword: e.target.value })
                      }
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                    E-mail da Profissional (Para onde o SMTP envia a recuperação
                    dela)
                  </label>
                  <input
                    type="email"
                    autoComplete="off"
                    value={config.adminEmail || ""}
                    onChange={(e) =>
                      setConfig({ ...config, adminEmail: e.target.value })
                    }
                    placeholder="ex: emaildaisabele@gmail.com"
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                  />
                </div>

                {/* Passkeys da Profissional */}
                {profPasskeys.length > 0 && (
                  <div className="pt-2 border-t border-[#EFECE6] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#78716C]">
                        Passkeys da Profissional ({profPasskeys.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          runAdminAction("toggle-admin-2fa", {
                            action: "passkey_toggle_2fa",
                            targetRole: "admin",
                            requirePasskey2FA: !config.adminRequirePasskey2FA,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          config.adminRequirePasskey2FA
                            ? "bg-[#10B981] text-white"
                            : "bg-[#E7E2DA] text-[#57534E]"
                        }`}
                      >
                        2FA:{" "}
                        {config.adminRequirePasskey2FA ? "Obrigatório" : "Opcional"}
                      </button>
                    </div>
                    {profPasskeys.map((pk) => (
                      <div
                        key={pk.id}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold truncate">{pk.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction(`del-admin-pk-${pk.id}`, {
                              action: "passkey_delete",
                              targetRole: "admin",
                              passkeyId: pk.id,
                            })
                          }
                          className="text-red-600 font-bold text-[11px] cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  disabled={busyAction === "save-admin-account"}
                  onClick={() =>
                    runAdminAction("save-admin-account", {
                      action: "update_config",
                      adminUsername: config.adminUsername,
                      adminPassword: config.adminPassword,
                      adminEmail: config.adminEmail || "",
                    })
                  }
                  className="w-full py-3 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                >
                  {busyAction === "save-admin-account" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Salvar Conta da Profissional</span>
                </button>
              </section>

              {/* Card 2: Sua Conta de Gestor (SuperAdmin) */}
              <section className="p-5 rounded-[24px] bg-white border border-[#EFECE6] space-y-3.5 animate-card">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#059669]">
                      ROLE: SUPERADMIN (GESTOR DO SISTEMA)
                    </span>
                    <h3 className="text-sm font-extrabold text-[#111111]">
                      Sua Conta de SuperAdmin
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#141519] text-[#10B981] text-[10px] font-bold">
                    @{config.superAdminUsername || "fr4nce"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                      Seu Usuário (SuperAdmin)
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={config.superAdminUsername || "fr4nce"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          superAdminUsername: e.target.value,
                        })
                      }
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                      Sua Senha (SuperAdmin)
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={config.superAdminPassword || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          superAdminPassword: e.target.value,
                        })
                      }
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                    Seu E-mail Pessoal de Recuperação (SuperAdmin)
                  </label>
                  <input
                    type="email"
                    autoComplete="off"
                    value={config.superAdminEmail || ""}
                    onChange={(e) =>
                      setConfig({ ...config, superAdminEmail: e.target.value })
                    }
                    placeholder="guilhermefrance9@gmail.com"
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                  />
                </div>

                <button
                  type="button"
                  disabled={busyAction === "save-super-account"}
                  onClick={() =>
                    runAdminAction("save-super-account", {
                      action: "update_config",
                      superAdminUsername: config.superAdminUsername,
                      superAdminPassword: config.superAdminPassword,
                      superAdminEmail: config.superAdminEmail || "",
                    })
                  }
                  className="w-full py-3 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                >
                  {busyAction === "save-super-account" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Salvar Conta SuperAdmin</span>
                </button>
              </section>
            </main>
          )}

          {/* ==================== SUPER TAB 3: PROVEDOR SMTP & SEGURANÇA (PASSKEYS) ==================== */}
          {superTab === "smtp_seguranca" && (
            <main className="px-5 pt-5 space-y-4 flex-1">
              <div className="animate-card">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C]">
                  INFRAESTRUTURA DE E-MAIL & AUTENTICAÇÃO
                </span>
                <h2 className="text-[22px] font-extrabold text-[#111111] tracking-tight">
                  Provedor SMTP & Passkey
                </h2>
              </div>

              {/* Provedor SMTP do Sistema */}
              <section className="p-5 rounded-[24px] bg-white border border-[#EFECE6] space-y-3.5 animate-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center shrink-0">
                      <Server className="w-4 h-4 text-[#111111]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#111111]">
                        Provedor SMTP do Sistema
                      </h3>
                      <p className="text-[11px] text-[#78716C]">
                        Conta remetente que dispara os códigos para cada usuário
                      </p>
                    </div>
                  </div>

                  {smtpReady && (
                    <span className="px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#059669] text-[10px] font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Ativo</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                      E-mail Remetente do Servidor SMTP
                    </label>
                    <input
                      type="email"
                      name="smtp_provider_user"
                      autoComplete="off"
                      value={config.smtpUser || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          smtpUser: e.target.value,
                        })
                      }
                      placeholder="ex: guilhermefrance9@gmail.com"
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                        Senha de App do Remetente (SMTP)
                      </label>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#111111] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Gerar Senha de App Gmail</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      name="smtp_provider_password"
                      autoComplete="new-password"
                      value={config.smtpPass || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          smtpPass: e.target.value,
                        })
                      }
                      placeholder="Senha de App de 16 caracteres"
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                        Host SMTP
                      </label>
                      <input
                        type="text"
                        value={config.smtpHost || "smtp.gmail.com"}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            smtpHost: e.target.value,
                          })
                        }
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                        Porta
                      </label>
                      <input
                        type="number"
                        value={config.smtpPort || 465}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            smtpPort: Number(e.target.value) || 465,
                          })
                        }
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busyAction === "save-smtp"}
                      onClick={() =>
                        runAdminAction("save-smtp", {
                          action: "update_config",
                          smtpHost: config.smtpHost || "smtp.gmail.com",
                          smtpPort: config.smtpPort || 465,
                          smtpUser: config.smtpUser || "",
                          smtpPass: config.smtpPass || "",
                        })
                      }
                      className="py-3 px-3 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                    >
                      {busyAction === "save-smtp" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Salvar Provedor</span>
                    </button>

                    <button
                      type="button"
                      disabled={busyAction === "test-smtp"}
                      onClick={() =>
                        runAdminAction("test-smtp", {
                          action: "test_recovery_email",
                          smtpHost: config.smtpHost || "smtp.gmail.com",
                          smtpPort: config.smtpPort || 465,
                          smtpUser: config.smtpUser || "",
                          smtpPass: config.smtpPass || "",
                          testDestinationEmail:
                            config.superAdminEmail || config.smtpUser || "",
                        })
                      }
                      className="py-3 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-[#111111] font-bold text-xs flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                    >
                      {busyAction === "test-smtp" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Testar Envio</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Suas Passkeys de SuperAdmin */}
              <section className="p-5 rounded-[24px] bg-white border border-[#EFECE6] space-y-4 animate-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center shrink-0">
                      <Fingerprint className="w-4 h-4 text-[#111111]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#111111]">
                        Passkey do SuperAdmin (2FA)
                      </h3>
                      <p className="text-[11px] text-[#78716C]">
                        Biometria vinculada exclusivamente ao perfil @
                        {config.superAdminUsername || "fr4nce"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={newPasskeyName}
                    onChange={(e) => setNewPasskeyName(e.target.value)}
                    placeholder="Nome do seu aparelho (ex: Meu Mac / Celular)"
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={registeringPasskey}
                    onClick={handleRegisterPasskey}
                    className="w-full py-3 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 smooth-press cursor-pointer"
                  >
                    {registeringPasskey ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Aguardando Biometria...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>+ Cadastrar Passkey SuperAdmin</span>
                      </>
                    )}
                  </button>
                </div>

                {superPasskeys.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-[#EFECE6]">
                    {superPasskeys.map((pk) => (
                      <div
                        key={pk.id}
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Fingerprint className="w-4 h-4 text-[#10B981] shrink-0" />
                          <span className="font-bold truncate">{pk.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction(`del-pk-${pk.id}`, {
                              action: "passkey_delete",
                              passkeyId: pk.id,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold text-[11px] cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ))}

                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-[#111111]">
                          Exigir Passkey 2FA no Login SuperAdmin
                        </p>
                        <p className="text-[11px] text-[#78716C]">
                          Solicita biometria após sua senha
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          runAdminAction("toggle-2fa", {
                            action: "passkey_toggle_2fa",
                            requirePasskey2FA: !config.superAdminRequire2FA,
                          })
                        }
                        className={`px-3 py-2 rounded-xl text-[11px] font-extrabold cursor-pointer ${
                          config.superAdminRequire2FA
                            ? "bg-[#10B981] text-white"
                            : "bg-[#E7E2DA] text-[#57534E]"
                        }`}
                      >
                        {config.superAdminRequire2FA ? "Ativado" : "Opcional"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </main>
          )}

          {/* ==================== SUPER TAB 4: ESTÚDIO & CONTROLE DE DADOS ==================== */}
          {superTab === "sistema" && (
            <main className="px-5 pt-5 space-y-4 flex-1">
              <div className="animate-card">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C]">
                  PARÂMETROS GLOBAIS & MANUTENÇÃO
                </span>
                <h2 className="text-[22px] font-extrabold text-[#111111] tracking-tight">
                  Controle do Sistema
                </h2>
              </div>

              <section className="p-5 rounded-[24px] bg-white border border-[#EFECE6] space-y-3.5 animate-card">
                <h3 className="text-sm font-extrabold text-[#111111]">
                  Identidade da Instância (Cliente)
                </h3>
                <div className="space-y-2.5">
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
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                      Nome da Profissional
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
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1">
                        WhatsApp Oficial
                      </label>
                      <input
                        type="text"
                        value={config.whatsapp}
                        onChange={(e) =>
                          setConfig({ ...config, whatsapp: e.target.value })
                        }
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
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
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      runAdminAction("save-instance", {
                        action: "update_config",
                        studioName: config.studioName,
                        professionalName: config.professionalName,
                        whatsapp: config.whatsapp,
                        instagram: config.instagram,
                      })
                    }
                    className="w-full py-3 rounded-xl bg-[#141519] text-white font-bold text-xs smooth-press cursor-pointer"
                  >
                    Salvar Parâmetros da Instância
                  </button>
                </div>
              </section>

              <section className="p-5 rounded-[24px] bg-white border border-[#EFECE6] space-y-3 animate-card">
                <h3 className="text-sm font-extrabold text-[#111111]">
                  Ferramentas de Manutenção
                </h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSuperViewStudioMode(true)}
                    className="w-full py-3 px-4 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-[#111111] font-bold text-xs flex items-center justify-between smooth-press cursor-pointer"
                  >
                    <span>Acessar Painel Operacional da Profissional</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      runAdminAction("clear-events", {
                        action: "clear_whatsapp_events",
                      })
                    }
                    className="w-full py-3 px-4 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-[#111111] font-bold text-xs flex items-center justify-between smooth-press cursor-pointer"
                  >
                    <span>
                      Limpar Log de Notificações ({whatsappEvents.length})
                    </span>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </section>
            </main>
          )}

          {/* ==================== SUPERADMIN BOTTOM NAVBAR ==================== */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EFECE6] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <div className="max-w-[440px] mx-auto px-5 pt-2.5 pb-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSuperTab("visao_geral")}
                className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-2.5 smooth-press cursor-pointer ${
                  superTab === "visao_geral"
                    ? "text-[#111111] font-extrabold scale-105"
                    : "text-[#A8A29E] font-medium hover:text-[#111111]"
                }`}
              >
                <Activity className="w-[21px] h-[21px] stroke-[2]" />
                <span className="text-[11px]">Visão Geral</span>
              </button>

              <button
                type="button"
                onClick={() => setSuperTab("contas")}
                className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-2.5 smooth-press cursor-pointer ${
                  superTab === "contas"
                    ? "text-[#111111] font-extrabold scale-105"
                    : "text-[#A8A29E] font-medium hover:text-[#111111]"
                }`}
              >
                <Users className="w-[21px] h-[21px] stroke-[2]" />
                <span className="text-[11px]">Contas</span>
              </button>

              <button
                type="button"
                onClick={() => setSuperTab("smtp_seguranca")}
                className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-2.5 smooth-press cursor-pointer ${
                  superTab === "smtp_seguranca"
                    ? "text-[#111111] font-extrabold scale-105"
                    : "text-[#A8A29E] font-medium hover:text-[#111111]"
                }`}
              >
                <Server className="w-[21px] h-[21px] stroke-[2]" />
                <span className="text-[11px]">SMTP & 2FA</span>
              </button>

              <button
                type="button"
                onClick={() => setSuperTab("sistema")}
                className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-2.5 smooth-press cursor-pointer ${
                  superTab === "sistema"
                    ? "text-[#111111] font-extrabold scale-105"
                    : "text-[#A8A29E] font-medium hover:text-[#111111]"
                }`}
              >
                <Database className="w-[21px] h-[21px] stroke-[2]" />
                <span className="text-[11px]">Sistema</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2.5">
            {userRole === "superadmin" && superViewStudioMode && (
              <button
                type="button"
                onClick={() => setSuperViewStudioMode(false)}
                aria-label="Voltar ao SuperAdmin"
                title="Voltar ao SuperAdmin"
                className="w-9 h-9 -ml-1.5 rounded-full bg-[#F4F1EC] hover:bg-[#EAE5DD] flex items-center justify-center text-[#111111] smooth-press cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}
            <div>
              <h1 className="text-[17px] font-extrabold text-[#111111] leading-tight">
                {shortStudioTitle || "Isabele Lash"}
              </h1>
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C] mt-0.5">
                PAINEL EXECUTIVO
              </span>
            </div>
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
                {isRefreshingPull ? (
                  homeDisplayMode === "clientes" ? (
                    <section className="px-5 py-5 rounded-[24px] bg-[#141519] shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex flex-col justify-center gap-2.5 animate-pulse">
                      <div className="h-3 w-28 rounded bg-white/15" />
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-8 rounded bg-[#10B981]/30" />
                        <div className="h-5 w-32 rounded bg-white/20" />
                      </div>
                    </section>
                  ) : (
                    <section className="p-4 rounded-[26px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3.5 animate-pulse">
                      <div className="flex items-center justify-between px-1">
                        <div className="h-3 w-28 rounded bg-[#EDE8E0]" />
                        <div className="h-3 w-24 rounded bg-[#EDE8E0]" />
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-[20px] bg-[#141519] flex flex-col justify-between min-h-[108px]"
                          >
                            <div className="h-2.5 w-14 rounded bg-white/15" />
                            <div className="h-5 w-16 rounded bg-white/25 my-1" />
                            <div className="h-2.5 w-16 rounded bg-white/15" />
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                ) : homeDisplayMode === "clientes" ? (
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

              {isRefreshingPull ? (
                <div className="space-y-2.5 flex-1 animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-[22px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.025)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-4 w-11 rounded bg-[#E8E2D9] shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-36 rounded bg-[#E8E2D9]" />
                          <div className="h-3 w-44 rounded bg-[#F3EFEA]" />
                        </div>
                      </div>
                      <div className="h-6 w-20 rounded-full bg-[#F4F1EC] shrink-0" />
                    </div>
                  ))}
                </div>
              ) : dailyAppointments.length === 0 ? (
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
                              onClick={() =>
                                router.push(`/atendimento/${appt.id}`)
                              }
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  router.push(`/atendimento/${appt.id}`);
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
                              onClick={() =>
                                router.push(`/atendimento/${appt.id}`)
                              }
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  router.push(`/atendimento/${appt.id}`);
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
              {isRefreshingPull
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-[22px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3 animate-pulse"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#E8E2D9] shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3.5 w-36 rounded bg-[#E8E2D9]" />
                          <div className="h-3 w-20 rounded bg-[#F3EFEA]" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-[#F4F1EC]" />
                        <div className="w-9 h-9 rounded-xl bg-red-50" />
                      </div>
                    </div>
                  ))
                : services.map((srv, idx) => (
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
                      <AdminThumbImage src={srv.imageUrl} alt={srv.name} />
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
                                  onClick={() =>
                                    router.push(`/atendimento/${appt.id}`)
                                  }
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ")
                                      router.push(`/atendimento/${appt.id}`);
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

                  {/* Passkeys & 2FA (WebAuthn Biometria / FaceID) */}
                  <section
                    className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4 animate-card smooth-card"
                    style={{ animationDelay: "90ms" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center shrink-0">
                          <Fingerprint className="w-4 h-4 text-[#111111]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-[#111111]">
                            Passkey & Biometria (2FA)
                          </h3>
                          <p className="text-[11px] text-[#78716C]">
                            FaceID, TouchID ou Digital do celular
                          </p>
                        </div>
                      </div>

                      {Array.isArray(config.passkeys) &&
                        config.passkeys.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#059669] text-[10px] font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Ativo</span>
                          </span>
                        )}
                    </div>

                    {/* Cadastrar Nova Passkey */}
                    <div className="space-y-2.5 pt-1">
                      <input
                        type="text"
                        value={newPasskeyName}
                        onChange={(e) => setNewPasskeyName(e.target.value)}
                        placeholder="Nome do aparelho (ex: iPhone da Isabele)"
                        className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                      />
                      <button
                        type="button"
                        disabled={registeringPasskey}
                        onClick={handleRegisterPasskey}
                        className="w-full py-3 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 smooth-press cursor-pointer"
                      >
                        {registeringPasskey ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Aguardando Biometria do Aparelho...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>+ Cadastrar Passkey neste Aparelho</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Lista de Passkeys Cadastradas */}
                    {Array.isArray(config.passkeys) &&
                      config.passkeys.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-[#EFECE6]">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                            Aparelhos Cadastrados ({config.passkeys.length})
                          </span>
                          <div className="space-y-2">
                            {config.passkeys.map((pk) => (
                              <div
                                key={pk.id}
                                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Fingerprint className="w-4 h-4 text-[#10B981] shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#111111] truncate">
                                      {pk.name}
                                    </p>
                                    <p className="text-[10px] text-[#78716C]">
                                      Cadastrado em{" "}
                                      {new Date(
                                        pk.createdAt
                                      ).toLocaleDateString("pt-BR")}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    runAdminAction(`del-pk-${pk.id}`, {
                                      action: "passkey_delete",
                                      passkeyId: pk.id,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] shrink-0 smooth-press cursor-pointer"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Toggle Exigir Passkey como 2FA após senha */}
                          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between gap-3 mt-2">
                            <div className="space-y-0.5">
                              <p className="text-xs font-extrabold text-[#111111]">
                                Exigir Passkey como 2FA no Login
                              </p>
                              <p className="text-[11px] text-[#78716C] leading-snug">
                                Mesmo digitando usuário e senha, solicita a
                                biometria para entrar.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                runAdminAction("toggle-2fa", {
                                  action: "passkey_toggle_2fa",
                                  requirePasskey2FA: !config.requirePasskey2FA,
                                })
                              }
                              className={`px-3 py-2 rounded-xl text-[11px] font-extrabold shrink-0 smooth-press cursor-pointer ${
                                config.requirePasskey2FA
                                  ? "bg-[#10B981] text-white"
                                  : "bg-[#E7E2DA] text-[#57534E]"
                              }`}
                            >
                              {config.requirePasskey2FA ? "Ativado" : "Opcional"}
                            </button>
                          </div>
                        </div>
                      )}
                  </section>

                  {/* E-mail de Recuperação de Acesso da Profissional */}
                  <section
                    className="p-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5 animate-card smooth-card"
                    style={{ animationDelay: "120ms" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-[#111111]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-[#111111]">
                            E-mail de Recuperação de Senha
                          </h3>
                          <p className="text-[11px] text-[#78716C]">
                            Receba o código de 6 dígitos neste e-mail caso
                            esqueça sua senha ou perca sua Passkey
                          </p>
                        </div>
                      </div>

                      {Boolean(config.adminEmail) && (
                        <span className="px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#059669] text-[10px] font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Salvo</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                          E-mail da Conta ({config.adminUsername})
                        </label>
                        <input
                          type="email"
                          name="recovery_email_address"
                          autoComplete="off"
                          value={config.adminEmail || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              adminEmail: e.target.value,
                            })
                          }
                          placeholder="ex: isabele@gmail.com"
                          className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={busyAction === "save-admin-email"}
                        onClick={() =>
                          runAdminAction("save-admin-email", {
                            action: "update_config",
                            adminEmail: config.adminEmail || "",
                          })
                        }
                        className="w-full py-3 px-3 rounded-xl bg-[#141519] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                      >
                        {busyAction === "save-admin-email" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Salvar E-mail de Recuperação</span>
                      </button>
                    </div>
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
                <div className="space-y-2 pt-0.5">
                  <p>
                    <b>Endereço (Domicílio):</b>{" "}
                    {selectedAppointment.clientAddress}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const addr = selectedAppointment.clientAddress!.trim();
                        const cleanAddr = addr.replace(/\([^)]*\)/g, "").trim();
                        const encodedAddr = encodeURIComponent(addr);
                        const shortTitle = encodeURIComponent(
                          addr.split(" - ")[0] || addr
                        );
                        let coords: { lat: number; lon: number } | null = null;
                        try {
                          const apiKey =
                            process.env.NEXT_PUBLIC_GEOAPIFY_KEY ||
                            "3b4d69632b19443ba05956f3a749ebdb";
                          const res = await fetch(
                            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
                              cleanAddr
                            )}&lang=pt&filter=circle:-40.8442,-14.8619,35000&bias=proximity:-40.8442,-14.8619&limit=1&format=json&apiKey=${apiKey}`
                          );
                          if (res.ok) {
                            const data = await res.json();
                            const first = data?.results?.[0];
                            if (
                              first &&
                              typeof first.lat === "number" &&
                              typeof first.lon === "number"
                            ) {
                              coords = { lat: first.lat, lon: first.lon };
                            }
                          }
                        } catch {
                          // fallback
                        }
                        try {
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(addr);
                          }
                        } catch {
                          // ignore
                        }
                        const isMobile = /Android|iPhone|iPad|iPod/i.test(
                          navigator.userAgent || ""
                        );
                        if (isMobile) {
                          const nativeUberUrl = coords
                            ? `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${coords.lat}&dropoff[longitude]=${coords.lon}&dropoff[nickname]=${shortTitle}&dropoff[formatted_address]=${encodedAddr}`
                            : `uber://?action=setPickup&pickup=my_location&dropoff[nickname]=${shortTitle}&dropoff[formatted_address]=${encodedAddr}`;
                          window.location.href = nativeUberUrl;
                          showToast("Abrindo app da Uber com endereço marcado...");
                        } else {
                          const dropJson = encodeURIComponent(
                            JSON.stringify({
                              latitude: coords?.lat,
                              longitude: coords?.lon,
                              addressLine1: addr.split(" - ")[0] || addr,
                              addressLine2: addr,
                            })
                          );
                          window.open(
                            `https://m.uber.com/go/home?drop[0]=${dropJson}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                          showToast("Abrindo Uber (endereço copiado!)");
                        }
                      }}
                      className="py-2 px-2.5 rounded-xl bg-[#111111] hover:bg-zinc-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-white/15 text-[9px] font-black">
                        Uber
                      </span>
                      <span>Abrir na Uber</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const addr = selectedAppointment.clientAddress!.trim();
                        const cleanAddr = addr.replace(/\([^)]*\)/g, "").trim();
                        const encodedAddr = encodeURIComponent(addr);
                        let coords: { lat: number; lon: number } | null = null;
                        try {
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(addr);
                          }
                        } catch {
                          // ignore
                        }
                        try {
                          const apiKey =
                            process.env.NEXT_PUBLIC_GEOAPIFY_KEY ||
                            "3b4d69632b19443ba05956f3a749ebdb";
                          const res = await fetch(
                            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
                              cleanAddr
                            )}&lang=pt&filter=circle:-40.8442,-14.8619,35000&bias=proximity:-40.8442,-14.8619&limit=1&format=json&apiKey=${apiKey}`
                          );
                          if (res.ok) {
                            const data = await res.json();
                            const first = data?.results?.[0];
                            if (
                              first &&
                              typeof first.lat === "number" &&
                              typeof first.lon === "number"
                            ) {
                              coords = { lat: first.lat, lon: first.lon };
                            }
                          }
                        } catch {
                          // fallback
                        }
                        const url99 = coords
                          ? `taxis99://call?dropoff_latitude=${coords.lat}&dropoff_longitude=${coords.lon}&dropoff_title=${encodedAddr}&deep_link_product_id=316`
                          : `taxis99://call?dropoff_title=${encodedAddr}&deep_link_product_id=316`;
                        window.location.href = url99;
                        showToast("Abrindo 99 com endereço marcado...");
                      }}
                      className="py-2 px-2.5 rounded-xl bg-[#FFB800] hover:bg-[#F2AE00] text-[#111111] font-extrabold text-[11px] flex items-center justify-center gap-1.5 smooth-press cursor-pointer"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-[#111111] text-[#FFB800] text-[9px] font-black">
                        99
                      </span>
                      <span>Abrir no 99</span>
                    </button>
                  </div>
                </div>
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

              {/* ENDEREÇO PARA ATENDIMENTO A DOMICÍLIO (Geoapify Autocomplete + Número e Complemento) */}
              <div className="space-y-2.5">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="admin-manual-address"
                      className="text-[10px] font-bold uppercase text-[#78716C] block"
                    >
                      Endereço (Atendimento a Domicílio)
                    </label>
                    {manualAddressVerifiedBase ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#10B981]">
                        <Check className="w-3 h-3 stroke-[2.8]" />
                        <span>Localizado no Maps</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#A8A29E]">
                        Busca no mapa
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 flex items-center gap-2">
                    <MapPin
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        manualAddressVerifiedBase
                          ? "text-[#10B981]"
                          : "text-[#9CA3AF]"
                      }`}
                    />
                    <input
                      id="admin-manual-address"
                      type="text"
                      name="geoapify_manual_street_search"
                      autoComplete="new-password"
                      value={manualAddressStreetQuery}
                      onFocus={() => setShowManualGeoDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => setShowManualGeoDropdown(false), 180);
                      }}
                      onChange={(e) => {
                        setManualAddressStreetQuery(e.target.value);
                        setManualAddressVerifiedBase(null);
                        setShowManualGeoDropdown(true);
                      }}
                      placeholder="Digite a rua, avenida ou CEP..."
                      className="w-full bg-transparent text-xs font-medium text-[#111111] placeholder:text-[#A8A29E] focus:outline-none"
                    />
                    {loadingManualGeo && (
                      <Loader2 className="w-3.5 h-3.5 text-[#78716C] animate-spin shrink-0" />
                    )}
                    {manualAddressStreetQuery && !loadingManualGeo && (
                      <button
                        type="button"
                        aria-label="Limpar endereço"
                        onClick={() => {
                          setManualAddressStreetQuery("");
                          setManualAddressVerifiedBase(null);
                          setManualGeoSuggestions([]);
                        }}
                        className="w-5 h-5 rounded-full bg-[#EFECE6] hover:bg-[#E5E0D8] flex items-center justify-center text-[#78716C] shrink-0 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {manualAddressVerifiedBase && (
                    <p className="text-[11px] font-medium text-[#78716C] mt-1 pl-1 truncate">
                      {[
                        manualAddressVerifiedBase.suburb,
                        manualAddressVerifiedBase.city &&
                        manualAddressVerifiedBase.state
                          ? `${manualAddressVerifiedBase.city} - ${manualAddressVerifiedBase.state}`
                          : manualAddressVerifiedBase.city,
                        manualAddressVerifiedBase.postcode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  {/* Dropdown de sugestões Geoapify */}
                  {showManualGeoDropdown &&
                    !manualAddressVerifiedBase &&
                    (manualGeoSuggestions.length > 0 ||
                      (manualAddressStreetQuery.trim().length >= 3 &&
                        !loadingManualGeo)) && (
                      <ScrollArea
                        maxHeightClass="max-h-44"
                        className="mt-1.5 p-1.5 rounded-xl bg-white border border-[#E5E0D8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] space-y-1"
                      >
                        {manualGeoSuggestions.length === 0 ? (
                          <p className="text-[11px] text-[#78716C] py-2 px-2">
                            Nenhum endereço encontrado. Tente digitar o nome da
                            rua ou CEP.
                          </p>
                        ) : (
                          manualGeoSuggestions.map((item) => (
                            <button
                              key={item.placeId}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setManualAddressStreetQuery(
                                  item.street || item.line1
                                );
                                if (
                                  item.housenumber &&
                                  !manualAddressNumber.trim()
                                ) {
                                  setManualAddressNumber(item.housenumber);
                                }
                                setManualAddressVerifiedBase({
                                  street: item.street || item.line1,
                                  suburb: item.suburb,
                                  city: item.city,
                                  state: item.state,
                                  postcode: item.postcode,
                                  formatted: item.formatted,
                                });
                                setShowManualGeoDropdown(false);
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

                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <label
                      htmlFor="admin-manual-address-num"
                      className="text-[10px] font-bold uppercase text-[#78716C] block mb-1"
                    >
                      Número
                    </label>
                    <input
                      id="admin-manual-address-num"
                      type="text"
                      autoComplete="off"
                      value={manualAddressNumber}
                      onChange={(e) => setManualAddressNumber(e.target.value)}
                      placeholder="Ex: 120"
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs font-medium"
                    />
                  </div>
                  <div className="col-span-3">
                    <label
                      htmlFor="admin-manual-address-comp"
                      className="text-[10px] font-bold uppercase text-[#78716C] block mb-1"
                    >
                      Complemento (Opcional)
                    </label>
                    <input
                      id="admin-manual-address-comp"
                      type="text"
                      autoComplete="off"
                      value={manualAddressComplement}
                      onChange={(e) =>
                        setManualAddressComplement(e.target.value)
                      }
                      placeholder="Casa, Apto, Ref..."
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs font-medium"
                    />
                  </div>
                </div>
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
                      setManualAppt((prev) => ({
                        ...prev,
                        clientName: "",
                        clientPhone: "",
                        clientAddress: "",
                        clientNotes: "",
                      }));
                      setManualAddressStreetQuery("");
                      setManualAddressNumber("");
                      setManualAddressComplement("");
                      setManualAddressVerifiedBase(null);
                      setManualGeoSuggestions([]);
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
          <ScrollArea className="space-y-2.5 flex-1 min-h-0">
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
          </ScrollArea>
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
