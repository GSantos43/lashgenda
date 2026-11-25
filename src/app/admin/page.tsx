"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Link2,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  Plus,
  Save,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Edit3,
  BookOpen,
} from "lucide-react";

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
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  message: string;
  createdAt: string;
}

function getTodayStr(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Login states
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "agenda" | "servicos" | "linktree" | "horarios" | "financeiro" | "clientes"
  >("agenda");

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

  // Agenda Filter
  const [agendaDate, setAgendaDate] = useState<string>("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualAppt, setManualAppt] = useState({
    serviceId: "",
    date: "",
    time: "09:00",
    clientName: "",
    clientPhone: "",
    clientNotes: "",
  });

  // Service Form State
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Linktree Button Form State
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
  const [newBlockedReason, setNewBlockedReason] = useState("");

  // New badge & portfolio photo inputs
  const [newBadgeText, setNewBadgeText] = useState("");
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");

  // Financeiro week reference
  const [financeWeekDate, setFinanceWeekDate] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadAdminData = async () => {
    try {
      const res = await fetch("/api/admin", { cache: "no-store" });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
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
    setAgendaDate(today);
    setFinanceWeekDate(today);
    setManualAppt((prev) => ({ ...prev, date: today }));
    setNewBlock((prev) => ({ ...prev, date: today }));
    loadAdminData();
  }, []);

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
        return;
      }
      await loadAdminData();
      showToast("Bem-vinda ao Painel Administrativo! ✨");
    } catch (err) {
      console.error(err);
      setLoginError("Erro ao conectar ao servidor.");
    } finally {
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

  const openWhatsAppClient = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, "");
    const full = clean.startsWith("55") ? clean : `55${clean}`;
    window.open(
      `https://wa.me/${full}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyPublicLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast("Link da Bio copiado para a área de transferência!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#120b10] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-9 h-9 text-rose-400 animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-rose-200">
          Verificando Acesso Administrativo...
        </p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#120b10] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#1a1017] border border-rose-900/50 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center">
              <Lock className="w-7 h-7 text-rose-400" />
            </div>
            <h1 className="text-lg font-black uppercase tracking-wider text-rose-300">
              Painel da Lash Designer
            </h1>
            <p className="text-xs text-rose-200/70">
              Entre com seu login e senha para gerenciar agendamentos, catálogo,
              horários e seu Linktree.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-rose-200/80 block mb-1">
                Usuário
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-3 text-sm text-rose-50 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-200/80 block mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-3 text-sm text-rose-50 focus:outline-none focus:border-rose-400"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-400 via-rose-300 to-amber-200 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
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

          <div className="pt-2 border-t border-rose-900/40 text-center space-y-2">
            <p className="text-[11px] text-rose-300/50">
              Acesso padrão inicial: <b>admin</b> / <b>123456</b>
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-xs font-bold text-rose-400 hover:underline"
            >
              ← Voltar para o Linktree da Cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter appointments for selected agendaDate
  const dailyAppointments = appointments
    .filter((a) => a.date === agendaDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Calculate Weekly Financial Summary
  const getWeekBounds = (refDateStr: string) => {
    if (!refDateStr || !refDateStr.includes("-")) {
      return { start: "2026-01-01", end: "2026-01-07" };
    }
    const [y, m, d] = refDateStr.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const day = dt.getDay(); // 0 Sun .. 6 Sat
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
  const completedWeek = weekAppointments.filter((a) => a.status === "concluido");
  const scheduledWeek = weekAppointments.filter((a) => a.status === "agendado");
  const canceledWeek = weekAppointments.filter((a) => a.status === "cancelado");
  const totalRevenueCompleted = completedWeek.reduce(
    (acc, cur) => acc + cur.price,
    0
  );
  const totalRevenueProjected = scheduledWeek.reduce(
    (acc, cur) => acc + cur.price,
    0
  );

  return (
    <div className="min-h-screen bg-[#120b10] text-rose-50 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-500 text-zinc-950 font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#180f15]/95 backdrop-blur-md border-b border-rose-900/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-rose-300">
                Gestão • {config?.studioName}
              </h1>
              <p className="text-[11px] text-rose-300/60">
                Logada como {config?.professionalName} ({config?.adminUsername})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyPublicLink}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-200 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/25 transition"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Copiar Link da Bio</span>
            </button>

            <button
              onClick={() => router.push("/")}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-rose-900/50 text-rose-200 text-xs font-bold flex items-center gap-1 hover:bg-rose-950/50 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
              <span>Ver Site</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={busyAction === "logout"}
              className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1 hover:bg-red-500/25 transition"
            >
              {busyAction === "logout" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* NAVIGATION TABS */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-[#1a1017] p-2 rounded-2xl border border-rose-900/40">
          {[
            { id: "agenda", label: "Agenda & Avisos", icon: Calendar },
            { id: "servicos", label: "Catálogo & Select", icon: BookOpen },
            { id: "linktree", label: "Linktree & Bio", icon: Link2 },
            { id: "horarios", label: "Horários & Folgas", icon: Clock },
            { id: "financeiro", label: "Caixa Semanal", icon: DollarSign },
            { id: "clientes", label: "Bloqueios & Senha", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "agenda"
                      | "servicos"
                      | "linktree"
                      | "horarios"
                      | "financeiro"
                      | "clientes"
                  )
                }
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                  active
                    ? "bg-gradient-to-r from-rose-400 to-amber-300 text-zinc-950 shadow-md"
                    : "text-rose-200/70 hover:bg-rose-950/40 hover:text-rose-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px] text-center leading-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ==================== TAB 1: AGENDA DIÁRIA & AVISOS WHATSAPP ==================== */}
        {activeTab === "agenda" && (
          <div className="space-y-6">
            {/* Daily Schedule Card */}
            <section className="bg-[#1a1017] border border-rose-900/50 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-rose-300 uppercase tracking-wide">
                    📅 Agenda Diária por Data
                  </h2>
                  <p className="text-xs text-rose-300/60">
                    Acompanhe as clientes agendadas, conclua atendimentos ou
                    envie lembretes pelo WhatsApp.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={agendaDate}
                    onChange={(e) => setAgendaDate(e.target.value)}
                    className="bg-[#120b10] border border-rose-800/60 rounded-xl px-3 py-2 text-xs font-bold text-rose-100"
                  />
                  <button
                    onClick={() => setShowManualModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500 text-zinc-950 font-black text-xs flex items-center gap-1.5 hover:bg-rose-400 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Encaixar Cliente</span>
                  </button>
                </div>
              </div>

              {dailyAppointments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#120b10] border border-rose-950 text-center space-y-1">
                  <p className="text-sm font-bold text-rose-300/80">
                    Nenhum agendamento para{" "}
                    {agendaDate.split("-").reverse().join("/")}.
                  </p>
                  <p className="text-xs text-rose-300/50">
                    Os horários estão livres para reservas online das clientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyAppointments.map((appt) => {
                    const isUpdating = busyAction === `appt-${appt.id}`;
                    return (
                      <div
                        key={appt.id}
                        className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          appt.status === "concluido"
                            ? "bg-emerald-950/20 border-emerald-600/40"
                            : appt.status === "cancelado"
                            ? "bg-red-950/15 border-red-800/30 opacity-70"
                            : "bg-[#120b10] border-rose-800/50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-black text-xs">
                              ⏰ {appt.time}
                            </span>
                            <span className="text-sm font-black text-rose-50">
                              {appt.clientName}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                appt.status === "concluido"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : appt.status === "cancelado"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-amber-400/20 text-amber-300"
                              }`}
                            >
                              {appt.status}
                            </span>
                          </div>
                          <p className="text-xs text-rose-200 font-semibold">
                            💆‍♀️ {appt.serviceName} —{" "}
                            <b className="text-amber-300">
                              {formatBRL(appt.price)}
                            </b>{" "}
                            ({appt.duration})
                          </p>
                          <p className="text-xs text-rose-300/70">
                            📱 WhatsApp: {appt.clientPhone}
                            {appt.clientNotes && ` • Obs: "${appt.clientNotes}"`}
                          </p>
                          {appt.status === "cancelado" && appt.cancelReason && (
                            <p className="text-[11px] text-red-300">
                              Motivo cancelamento: {appt.cancelReason}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsAppClient(
                                appt.clientPhone,
                                `Olá ${appt.clientName}! ✨ Passando para confirmar seu agendamento de *${appt.serviceName}* no ${config?.studioName} dia *${appt.date.split("-").reverse().join("/")} às ${appt.time}*. Podemos confirmar?`
                              )
                            }
                            className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/25"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chamar</span>
                          </button>

                          {appt.status !== "concluido" && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                runAdminAction(`appt-${appt.id}`, {
                                  action: "update_appointment_status",
                                  id: appt.id,
                                  status: "concluido",
                                })
                              }
                              className="px-3 py-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold flex items-center gap-1 hover:bg-sky-500/30"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Concluir</span>
                            </button>
                          )}

                          {appt.status !== "cancelado" && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                runAdminAction(`appt-${appt.id}`, {
                                  action: "update_appointment_status",
                                  id: appt.id,
                                  status: "cancelado",
                                  cancelReason: "Desmarcado pela profissional",
                                })
                              }
                              className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1 hover:bg-red-500/25"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Desmarcar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              runAdminAction(`appt-${appt.id}`, {
                                action: "delete_appointment",
                                id: appt.id,
                              })
                            }
                            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400"
                            title="Excluir registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* WhatsApp Events & Cancellation History (Inspired by Reference Site) */}
            <section className="bg-[#1a1017] border border-emerald-500/30 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-emerald-300">
                    💬 Central de Avisos & Histórico de Agendamentos/Cancelamentos
                  </h3>
                  <p className="text-xs text-rose-300/60">
                    Cada reserva ou cancelamento feito pelas clientes fica
                    registrado aqui com botão para enviar mensagem pronta.
                  </p>
                </div>
                {whatsappEvents.length > 0 && (
                  <button
                    onClick={() =>
                      runAdminAction("clear-events", {
                        action: "clear_whatsapp_events",
                      })
                    }
                    disabled={busyAction === "clear-events"}
                    className="text-xs text-rose-300/70 hover:text-rose-200 underline"
                  >
                    Limpar histórico
                  </button>
                )}
              </div>

              {whatsappEvents.length === 0 ? (
                <p className="text-xs text-rose-300/50 py-3">
                  Nenhum evento recente registrado.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {whatsappEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        ev.type === "cancelamento_cliente"
                          ? "bg-red-950/20 border-red-500/30"
                          : "bg-[#120b10] border-emerald-500/20"
                      }`}
                    >
                      <div className="space-y-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            ev.type === "cancelamento_cliente"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {ev.type === "cancelamento_cliente"
                            ? "⚠️ Cliente Desmarcou"
                            : "✨ Novo Agendamento"}
                        </span>
                        <p className="text-xs font-bold text-rose-100">
                          {ev.clientName} ({ev.clientPhone}) — {ev.serviceName}
                        </p>
                        <p className="text-[11px] text-rose-300/70">
                          Data: {ev.date.split("-").reverse().join("/")} às{" "}
                          {ev.time}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          openWhatsAppClient(
                            ev.clientPhone,
                            ev.type === "cancelamento_cliente"
                              ? `Olá ${ev.clientName}! Vi que você precisou desmarcar seu horário de ${ev.serviceName}. Deseja reagendar para outro dia da semana? ✨`
                              : `Olá ${ev.clientName}! ✨ Recebi seu agendamento de *${ev.serviceName}* para o dia *${ev.date.split("-").reverse().join("/")} às ${ev.time}*. Te espero no estúdio!`
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs flex items-center gap-1.5 shrink-0 hover:bg-emerald-400"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Responder Cliente</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==================== TAB 2: CATÁLOGO & SERVIÇOS (SELECT) ==================== */}
        {activeTab === "servicos" && (
          <div className="space-y-6">
            <section className="bg-[#1a1017] border border-rose-900/50 rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-black text-rose-300 uppercase">
                    ✨ Procedimentos do Catálogo & Select de Agendamento
                  </h2>
                  <p className="text-xs text-rose-300/60">
                    Todos os procedimentos ativos aparecem automaticamente no{" "}
                    <b>Select (Nome e Preço)</b> da página de agendamento e na
                    vitrine do Catálogo.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditingService({
                      name: "",
                      category: "Extensão de Cílios",
                      description: "",
                      price: 160,
                      duration: "1h 30min",
                      imageUrl:
                        "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=700&auto=format&fit=crop&q=80",
                      featured: false,
                      active: true,
                      order: services.length + 1,
                    })
                  }
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-400 to-amber-300 text-zinc-950 font-black text-xs uppercase flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Procedimento</span>
                </button>
              </div>

              {/* Service Modal / Form */}
              {editingService && (
                <div className="p-4 rounded-2xl bg-[#120b10] border border-rose-500/40 space-y-3.5">
                  <h3 className="text-xs font-black uppercase text-rose-300">
                    {editingService.id
                      ? "Editar Procedimento"
                      : "Cadastrar Novo Procedimento"}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-rose-300/70 block mb-1">
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
                        placeholder="Ex: Volume Brasileiro"
                        className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-rose-300/70 block mb-1">
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
                        placeholder="Ex: Extensão de Cílios, Manutenção..."
                        className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-rose-300/70 block mb-1">
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
                        className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-rose-300/70 block mb-1">
                        Tempo / Duração
                      </label>
                      <input
                        type="text"
                        value={editingService.duration}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            duration: e.target.value,
                          })
                        }
                        placeholder="Ex: 1h 45min"
                        className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-rose-300/70 block mb-1">
                      URL da Foto do Procedimento
                    </label>
                    <input
                      type="text"
                      value={editingService.imageUrl}
                      onChange={(e) =>
                        setEditingService({
                          ...editingService,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-rose-300/70 block mb-1">
                      Descrição detalhada (exibida no catálogo)
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
                      className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
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
                      <span>Destacar na página inicial (Mais Pedido)</span>
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
                      <span>Ativo para agendamento</span>
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
                      className="px-4 py-2.5 rounded-xl bg-rose-500 text-zinc-950 font-black text-xs uppercase flex items-center gap-1.5"
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
                      className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Services List */}
              <div className="space-y-2.5">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-2xl bg-[#120b10] border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {srv.imageUrl && (
                        <img
                          src={srv.imageUrl}
                          alt={srv.name}
                          className="w-12 h-12 rounded-xl object-cover border border-rose-500/20 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-100">
                            {srv.name}
                          </span>
                          <span className="text-xs font-black text-amber-300">
                            {formatBRL(srv.price)}
                          </span>
                          {!srv.active && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                              Oculto
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-rose-300/60">
                          {srv.category} • ⏱ {srv.duration}{" "}
                          {srv.featured && "• ⭐ Destaque"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEditingService(srv)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-200 text-xs font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        disabled={busyAction === `del-srv-${srv.id}`}
                        onClick={() =>
                          runAdminAction(`del-srv-${srv.id}`, {
                            action: "delete_service",
                            id: srv.id,
                          })
                        }
                        className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20"
                      >
                        {busyAction === `del-srv-${srv.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==================== TAB 3: LINKTREE, IDENTIDADE & PORTFÓLIO ==================== */}
        {activeTab === "linktree" && config && (
          <div className="space-y-6">
            {/* Studio Identity & Theme */}
            <section className="bg-[#1a1017] border border-rose-900/50 rounded-3xl p-5 space-y-4">
              <h2 className="text-base font-black text-rose-300 uppercase">
                🌸 Identidade do Estúdio & Cabeçalho do Linktree
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-rose-300/80 block mb-1">
                    Nome do Estúdio
                  </label>
                  <input
                    type="text"
                    value={config.studioName}
                    onChange={(e) =>
                      setConfig({ ...config, studioName: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-rose-300/80 block mb-1">
                    Nome da Lash Designer (Profissional)
                  </label>
                  <input
                    type="text"
                    value={config.professionalName}
                    onChange={(e) =>
                      setConfig({ ...config, professionalName: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-rose-300/80 block mb-1">
                    Frase de Destaque (Subtítulo)
                  </label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) =>
                      setConfig({ ...config, tagline: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-rose-300/80 block mb-1">
                    WhatsApp Principal (com DDD)
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp}
                    onChange={(e) =>
                      setConfig({ ...config, whatsapp: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-rose-300/80 block mb-1">
                    Foto de Perfil / Logo (URL)
                  </label>
                  <input
                    type="text"
                    value={config.logoUrl}
                    onChange={(e) =>
                      setConfig({ ...config, logoUrl: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-rose-300/80 block mb-1">
                    Imagem de Capa do Linktree (URL)
                  </label>
                  <input
                    type="text"
                    value={config.coverUrl}
                    onChange={(e) =>
                      setConfig({ ...config, coverUrl: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-rose-300/80 block mb-1">
                    Instagram (@usuario)
                  </label>
                  <input
                    type="text"
                    value={config.instagram}
                    onChange={(e) =>
                      setConfig({ ...config, instagram: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-rose-300/80 block mb-1">
                    Tema Visual do Site
                  </label>
                  <select
                    value={config.themeMode}
                    onChange={(e) =>
                      setConfig({ ...config, themeMode: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="dark-rose">
                      Dark Rose Gold (Fundo Escuro Sofisticado)
                    </option>
                    <option value="light-rose">
                      Light Nude & Rose (Fundo Claro Clean)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-rose-300/80 block mb-1">
                  Bio / Apresentação na Entrada
                </label>
                <textarea
                  rows={2}
                  value={config.bio}
                  onChange={(e) =>
                    setConfig({ ...config, bio: e.target.value })
                  }
                  className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-rose-300/80 block mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) =>
                    setConfig({ ...config, address: e.target.value })
                  }
                  className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                />
              </div>

              {/* Badges / Diferenciais */}
              <div className="space-y-2 pt-2 border-t border-rose-900/40">
                <label className="text-xs font-bold text-rose-300 block">
                  Selos / Diferenciais do Estúdio (ex: ❄️ Ambiente Climatizado)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {config.badges.map((b, i) => (
                    <span
                      key={i}
                      className="text-xs bg-rose-950/60 border border-rose-800/50 px-3 py-1 rounded-full flex items-center gap-1.5"
                    >
                      <span>{b}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            badges: config.badges.filter((_, idx) => idx !== i),
                          })
                        }
                        className="text-rose-400 hover:text-red-300 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                    placeholder="Novo selo (ex: ☕ Cappuccino Grátis)"
                    className="flex-1 bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBadgeText.trim()) return;
                      setConfig({
                        ...config,
                        badges: [...config.badges, newBadgeText.trim()],
                      });
                      setNewBadgeText("");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Portfolio Photos */}
              <div className="space-y-2 pt-2 border-t border-rose-900/40">
                <label className="text-xs font-bold text-rose-300 block">
                  Galeria de Fotos do Portfólio (exibida no Linktree)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {config.portfolio.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden border border-rose-800/50 group"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            portfolio: config.portfolio.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="absolute top-1 right-1 bg-black/80 text-red-300 text-[10px] px-1.5 py-0.5 rounded-lg"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPortfolioUrl}
                    onChange={(e) => setNewPortfolioUrl(e.target.value)}
                    placeholder="Cole a URL de uma foto de cílios (https://...)"
                    className="flex-1 bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPortfolioUrl.trim()) return;
                      setConfig({
                        ...config,
                        portfolio: [
                          ...config.portfolio,
                          newPortfolioUrl.trim(),
                        ],
                      });
                      setNewPortfolioUrl("");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold"
                  >
                    + Foto
                  </button>
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
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-400 to-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                {busyAction === "save-identity" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Salvar Identidade & Aparência</span>
              </button>
            </section>

            {/* Linktree Buttons Editor */}
            <section className="bg-[#1a1017] border border-rose-900/50 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-rose-300">
                    🔗 Botões do Linktree de Entrada
                  </h3>
                  <p className="text-xs text-rose-300/60">
                    Personalize os links que aparecem na página inicial (`/`).
                  </p>
                </div>
                <button
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
                  className="px-3.5 py-2 rounded-xl bg-rose-500 text-zinc-950 font-black text-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Botão</span>
                </button>
              </div>

              {editingLink && (
                <div className="p-4 rounded-2xl bg-[#120b10] border border-rose-500/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-rose-300/70 block mb-1">
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
                        placeholder="Ex: 📅 Agendar Meu Horário"
                        className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-rose-300/70 block mb-1">
                        Subtítulo
                      </label>
                      <input
                        type="text"
                        value={editingLink.subtitle}
                        onChange={(e) =>
                          setEditingLink({
                            ...editingLink,
                            subtitle: e.target.value,
                          })
                        }
                        placeholder="Ex: Escolha o procedimento e horário"
                        className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-rose-300/70 block mb-1">
                        Destino / Link * (`/agendar`, `/catalogo`,
                        `whatsapp:default` ou `https://...`)
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
                        className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-rose-300/70 block mb-1">
                        Ícone
                      </label>
                      <select
                        value={editingLink.icon}
                        onChange={(e) =>
                          setEditingLink({
                            ...editingLink,
                            icon: e.target.value,
                          })
                        }
                        className="w-full bg-[#1a1017] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                      >
                        <option value="calendar">Calendário (Agenda)</option>
                        <option value="book-open">Catálogo / Livro</option>
                        <option value="message-circle">WhatsApp / Chat</option>
                        <option value="clock">Relógio (Consultar)</option>
                        <option value="map-pin">Localização / Mapa</option>
                        <option value="instagram">Instagram</option>
                        <option value="sparkles">Brilho / Lash</option>
                        <option value="heart">Coração</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingLink.highlight}
                        onChange={(e) =>
                          setEditingLink({
                            ...editingLink,
                            highlight: e.target.checked,
                          })
                        }
                      />
                      <span>Botão em destaque (Dourado/Rose Gold)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingLink.active}
                        onChange={(e) =>
                          setEditingLink({
                            ...editingLink,
                            active: e.target.checked,
                          })
                        }
                      />
                      <span>Visível</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyAction === "save-link"}
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
                      className="px-4 py-2 rounded-xl bg-rose-500 text-zinc-950 font-black text-xs"
                    >
                      Salvar Botão
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLink(null)}
                      className="px-4 py-2 rounded-xl bg-stone-800 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {links.map((lk) => (
                  <div
                    key={lk.id}
                    className="p-3 rounded-2xl bg-[#120b10] border border-rose-900/40 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-rose-100">
                        {lk.title}{" "}
                        {lk.highlight && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 ml-1">
                            Destaque
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-rose-300/60">
                        {lk.subtitle} • Destino: <code>{lk.url}</code>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingLink(lk)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-200 text-xs font-bold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          runAdminAction(`del-lk-${lk.id}`, {
                            action: "delete_link",
                            id: lk.id,
                          })
                        }
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==================== TAB 4: HORÁRIOS & FOLGAS ==================== */}
        {activeTab === "horarios" && config && (
          <div className="space-y-6">
            {/* Available Time Slots */}
            <section className="bg-[#1a1017] border border-rose-900/50 rounded-3xl p-5 space-y-4">
              <h2 className="text-base font-black text-rose-300 uppercase">
                ⏰ Grade de Horários Disponíveis & Antecedência
              </h2>
              <p className="text-xs text-rose-300/60">
                Adicione ou remova os horários padrões que aparecem para as
                clientes na agenda.
              </p>

              <div className="flex flex-wrap gap-2">
                {config.availableSlots.map((slot) => (
                  <div
                    key={slot}
                    className="px-3.5 py-2 rounded-xl bg-[#120b10] border border-rose-800/60 flex items-center gap-2 text-xs font-bold"
                  >
                    <span>{slot}</span>
                    <button
                      type="button"
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
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 max-w-xs">
                <input
                  type="time"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  className="flex-1 bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs font-bold"
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
                  className="px-4 py-2.5 rounded-xl bg-rose-500 text-zinc-950 font-black text-xs uppercase"
                >
                  + Horário
                </button>
              </div>

              <div className="pt-4 border-t border-rose-900/40 space-y-2 max-w-md">
                <label className="text-xs font-bold text-rose-200 block">
                  ⏳ Antecedência mínima para agendar no mesmo dia
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
                    className="flex-1 bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value={0}>Sem antecedência mínima</option>
                    <option value={1}>1 hora antes</option>
                    <option value={2}>2 horas antes</option>
                    <option value={3}>3 horas antes</option>
                    <option value={4}>4 horas antes</option>
                  </select>
                  <button
                    type="button"
                    disabled={busyAction === "save-advance"}
                    onClick={() =>
                      runAdminAction("save-advance", {
                        action: "update_config",
                        minAdvanceHours: config.minAdvanceHours,
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold"
                  >
                    Salvar Regra
                  </button>
                </div>
              </div>
            </section>

            {/* Schedule Blocks / Folgas */}
            <section className="bg-[#1a1017] border border-red-500/30 rounded-3xl p-5 space-y-4">
              <h2 className="text-base font-black text-red-300 uppercase">
                🚫 Folgas e Bloqueio de Agenda
              </h2>
              <p className="text-xs text-rose-300/60">
                Feche a agenda em um dia inteiro de folga ou apenas em um
                intervalo de horário específico.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-rose-300/70 block mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={newBlock.date}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, date: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-rose-300/70 block mb-1">
                    Tipo de Bloqueio
                  </label>
                  <select
                    value={newBlock.type}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, type: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  >
                    <option value="dia">Dia inteiro / Folga</option>
                    <option value="horario">Somente um período</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-rose-300/70 block mb-1">
                    Motivo (exibido para a cliente)
                  </label>
                  <input
                    type="text"
                    value={newBlock.reason}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, reason: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              {newBlock.type === "horario" && (
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  <div>
                    <label className="text-xs text-rose-300/70 block mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) =>
                        setNewBlock({ ...newBlock, startTime: e.target.value })
                      }
                      className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-rose-300/70 block mb-1">
                      Fim
                    </label>
                    <input
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) =>
                        setNewBlock({ ...newBlock, endTime: e.target.value })
                      }
                      className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={busyAction === "add-block"}
                onClick={() =>
                  runAdminAction("add-block", {
                    action: "add_block",
                    ...newBlock,
                  })
                }
                className="px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 font-black text-xs uppercase flex items-center gap-2"
              >
                {busyAction === "add-block" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>Fechar Agenda neste Período</span>
              </button>

              {blocks.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-rose-900/40">
                  <h4 className="text-xs font-bold text-rose-200">
                    Bloqueios ativos:
                  </h4>
                  {blocks.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-[#120b10] border border-red-900/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-red-300">
                          📅 {b.date.split("-").reverse().join("/")}
                        </span>{" "}
                        —{" "}
                        {b.type === "dia"
                          ? "Dia Inteiro"
                          : `Das ${b.startTime} às ${b.endTime}`}{" "}
                        ({b.reason})
                      </div>
                      <button
                        onClick={() =>
                          runAdminAction(`del-blk-${b.id}`, {
                            action: "delete_block",
                            id: b.id,
                          })
                        }
                        className="text-red-400 hover:underline font-bold"
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

        {/* ==================== TAB 5: CAIXA & FINANCEIRO SEMANAL ==================== */}
        {activeTab === "financeiro" && (
          <div className="space-y-6">
            <section className="bg-[#1a1017] border border-rose-900/50 rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-rose-300 uppercase">
                    💰 Fechamento de Caixa Semanal
                  </h2>
                  <p className="text-xs text-rose-300/60">
                    Semana de {weekBounds.start.split("-").reverse().join("/")}{" "}
                    até {weekBounds.end.split("-").reverse().join("/")}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-rose-300/70 block mb-1">
                    Data de referência da semana
                  </label>
                  <input
                    type="date"
                    value={financeWeekDate}
                    onChange={(e) => setFinanceWeekDate(e.target.value)}
                    className="bg-[#120b10] border border-rose-800/60 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30">
                  <p className="text-xs text-emerald-300/80">
                    Faturamento Concluído
                  </p>
                  <p className="text-2xl font-black text-emerald-300 mt-1">
                    {formatBRL(totalRevenueCompleted)}
                  </p>
                  <p className="text-[11px] text-emerald-200/60 mt-0.5">
                    {completedWeek.length} procedimentos realizados
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                  <p className="text-xs text-amber-300/80">
                    Previsão (Agendados)
                  </p>
                  <p className="text-2xl font-black text-amber-300 mt-1">
                    {formatBRL(totalRevenueProjected)}
                  </p>
                  <p className="text-[11px] text-amber-200/60 mt-0.5">
                    {scheduledWeek.length} atendimentos pendentes
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#120b10] border border-rose-900/50">
                  <p className="text-xs text-rose-300/80">
                    Total Previsto na Semana
                  </p>
                  <p className="text-2xl font-black text-rose-300 mt-1">
                    {formatBRL(totalRevenueCompleted + totalRevenueProjected)}
                  </p>
                  <p className="text-[11px] text-rose-300/50 mt-0.5">
                    {canceledWeek.length} desmarcações na semana
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-rose-900/40">
                <h3 className="text-xs font-bold uppercase text-rose-300">
                  Detalhamento dos Atendimentos da Semana
                </h3>
                {weekAppointments.length === 0 ? (
                  <p className="text-xs text-rose-300/50 py-4">
                    Nenhum atendimento registrado nesta semana.
                  </p>
                ) : (
                  weekAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-[#120b10] border border-rose-900/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-rose-100">
                          {a.date.split("-").reverse().join("/")} às {a.time}
                        </span>{" "}
                        — {a.clientName} ({a.serviceName})
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-300">
                          {formatBRL(a.price)}
                        </span>
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                            a.status === "concluido"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : a.status === "cancelado"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ==================== TAB 6: BLOQUEIO DE CLIENTES & SENHA ADMIN ==================== */}
        {activeTab === "clientes" && config && (
          <div className="space-y-6">
            {/* Blocked Clients */}
            <section className="bg-[#1a1017] border border-red-500/30 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <div>
                  <h2 className="text-base font-black text-red-300 uppercase">
                    🚫 Clientes Bloqueadas
                  </h2>
                  <p className="text-xs text-rose-300/60">
                    Bloqueie números de WhatsApp de clientes que faltam sem
                    avisar. O sistema impedirá novos agendamentos online.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="tel"
                  value={newBlockedPhone}
                  onChange={(e) => setNewBlockedPhone(e.target.value)}
                  placeholder="WhatsApp com DDD (ex: 11988887777)"
                  className="bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                />
                <input
                  type="text"
                  value={newBlockedName}
                  onChange={(e) => setNewBlockedName(e.target.value)}
                  placeholder="Nome da cliente (opcional)"
                  className="bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                />
                <input
                  type="text"
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  placeholder="Motivo (ex: Não compareceu 2x)"
                  className="bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                />
              </div>

              <button
                type="button"
                disabled={busyAction === "block-client"}
                onClick={() =>
                  runAdminAction(
                    "block-client",
                    {
                      action: "block_client",
                      phone: newBlockedPhone,
                      name: newBlockedName,
                      reason: newBlockedReason,
                    },
                    () => {
                      setNewBlockedPhone("");
                      setNewBlockedName("");
                      setNewBlockedReason("");
                    }
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 font-black text-xs uppercase"
              >
                Bloquear Número
              </button>

              {blockedClients.length > 0 && (
                <div className="space-y-2 pt-2">
                  {blockedClients.map((bc) => (
                    <div
                      key={bc.id}
                      className="p-3 rounded-xl bg-[#120b10] border border-red-900/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <b className="text-red-300">{bc.phone}</b>{" "}
                        {bc.name && `(${bc.name})`} — {bc.reason}
                      </div>
                      <button
                        onClick={() =>
                          runAdminAction(`unblock-${bc.id}`, {
                            action: "unblock_client",
                            id: bc.id,
                          })
                        }
                        className="text-emerald-400 hover:underline font-bold"
                      >
                        Desbloquear
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Admin Credentials */}
            <section className="bg-[#1a1017] border border-rose-900/50 rounded-3xl p-5 space-y-4">
              <h2 className="text-base font-black text-rose-300 uppercase">
                🔐 Login e Senha de Acesso da Profissional
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <div>
                  <label className="text-xs text-rose-300/70 block mb-1">
                    Usuário de Login
                  </label>
                  <input
                    type="text"
                    value={config.adminUsername}
                    onChange={(e) =>
                      setConfig({ ...config, adminUsername: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-rose-300/70 block mb-1">
                    Nova Senha
                  </label>
                  <input
                    type="text"
                    value={config.adminPassword || ""}
                    onChange={(e) =>
                      setConfig({ ...config, adminPassword: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={busyAction === "save-creds"}
                onClick={() =>
                  runAdminAction("save-creds", {
                    action: "update_config",
                    adminUsername: config.adminUsername,
                    adminPassword: config.adminPassword,
                  })
                }
                className="px-5 py-3 rounded-xl bg-rose-500 text-zinc-950 font-black text-xs uppercase flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Atualizar Login e Senha</span>
              </button>
            </section>
          </div>
        )}
      </main>

      {/* MODAL: ENCAIXE / AGENDAMENTO MANUAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1a1017] border border-rose-800/60 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-rose-300">
                ＋ Novo Agendamento Manual
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-xs text-rose-300"
              >
                Fechar ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-rose-300/70 block mb-1">
                  Procedimento
                </label>
                <select
                  value={manualAppt.serviceId}
                  onChange={(e) =>
                    setManualAppt({ ...manualAppt, serviceId: e.target.value })
                  }
                  className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs font-bold"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatBRL(s.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-rose-300/70 block mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={manualAppt.date}
                    onChange={(e) =>
                      setManualAppt({ ...manualAppt, date: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-rose-300/70 block mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={manualAppt.time}
                    onChange={(e) =>
                      setManualAppt({ ...manualAppt, time: e.target.value })
                    }
                    className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-rose-300/70 block mb-1">
                  Nome da Cliente
                </label>
                <input
                  type="text"
                  value={manualAppt.clientName}
                  onChange={(e) =>
                    setManualAppt({ ...manualAppt, clientName: e.target.value })
                  }
                  placeholder="Ex: Amanda Silva"
                  className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-rose-300/70 block mb-1">
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
                  className="w-full bg-[#120b10] border border-rose-800/60 rounded-xl p-2.5 text-xs"
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
                className="w-full py-3 rounded-xl bg-rose-500 text-zinc-950 font-black text-xs uppercase flex items-center justify-center gap-2"
              >
                {busyAction === "manual-appt" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>Confirmar Encaixe</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
