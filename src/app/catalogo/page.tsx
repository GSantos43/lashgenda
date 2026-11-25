"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Search,
} from "lucide-react";

interface StudioConfig {
  studioName: string;
  professionalName: string;
  tagline: string;
  whatsapp: string;
  logoUrl: string;
  themeMode: string;
}

interface ServiceItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  imageUrl: string;
  featured: boolean;
}

export default function CatalogoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await fetch("/api/public", { cache: "no-store" });
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.services) setServices(data.services);
      } catch (err) {
        console.error("Erro ao carregar catálogo:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const categories = [
    "Todos",
    ...Array.from(new Set(services.map((s) => s.category || "Extensão de Cílios"))),
  ];

  const filteredServices = services.filter((s) => {
    const matchesCategory =
      selectedCategory === "Todos" || s.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectForBooking = (serviceId: number) => {
    setBookingId(serviceId);
    router.push(`/agendar?serviceId=${serviceId}`);
  };

  const getWhatsAppDoubtUrl = (serviceName: string) => {
    const phone = (config?.whatsapp || "11999999999").replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const text = encodeURIComponent(
      `Olá! Estava vendo o catálogo do ${config?.studioName || "estúdio"} e gostaria de saber mais sobre o procedimento: *${serviceName}* ✨`
    );
    return `https://wa.me/${fullPhone}?text=${text}`;
  };

  const isLight = config?.themeMode === "light-rose";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120b10] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-9 h-9 text-rose-400 animate-spin mb-3" />
        <p className="text-sm font-bold text-rose-200 uppercase tracking-wider">
          Carregando Catálogo de Procedimentos...
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
      {/* Header */}
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
          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
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
          <span>Início</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-black uppercase tracking-widest text-rose-400 block">
            Catálogo de Técnicas
          </span>
          <span className="text-[10px] text-rose-300/60">
            {config?.studioName}
          </span>
        </div>

        <button
          onClick={() => {
            setBookingId(-1);
            router.push("/agendar");
          }}
          disabled={bookingId !== null}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-500 text-zinc-950 hover:bg-rose-400 transition"
        >
          {bookingId === -1 ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Calendar className="w-3.5 h-3.5" />
          )}
          <span>Agenda</span>
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Intro Banner */}
        <div
          className={`p-5 rounded-3xl border text-center space-y-2 ${
            isLight
              ? "bg-white border-rose-200 shadow-sm"
              : "bg-[#1a1017] border-rose-900/40 shadow-xl"
          }`}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Menu de Procedimentos • {config?.professionalName}</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">
            Escolha o Olhar Perfeito para Você
          </h1>
          <p
            className={`text-xs leading-relaxed ${
              isLight ? "text-stone-600" : "text-rose-200/70"
            }`}
          >
            Todos os procedimentos incluem avaliação personalizada do formato dos
            seus olhos (visagismo) e materiais hipoalergênicos de alta retenção.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar técnica (ex: Volume Brasileiro, Fox Eyes, Manutenção)..."
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs focus:outline-none focus:border-rose-400 transition ${
                isLight
                  ? "bg-white border-rose-200 text-stone-900 placeholder:text-stone-400"
                  : "bg-[#1a1017] border-rose-900/50 text-rose-50 placeholder:text-rose-300/40"
              }`}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                    active
                      ? "bg-gradient-to-r from-rose-400 to-amber-300 text-zinc-950 border-rose-300 shadow-md"
                      : isLight
                      ? "bg-white border-rose-200 text-stone-600 hover:bg-rose-50"
                      : "bg-[#1a1017] border-rose-900/40 text-rose-200/80 hover:border-rose-500/40"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Services Cards List */}
        {filteredServices.length === 0 ? (
          <div
            className={`p-8 rounded-3xl border text-center space-y-2 ${
              isLight
                ? "bg-white border-rose-200"
                : "bg-[#1a1017] border-rose-900/40"
            }`}
          >
            <p className="text-sm font-bold text-rose-300">
              Nenhum procedimento encontrado para esse filtro.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("Todos");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-rose-400 underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((srv) => {
              const isBookingThis = bookingId === srv.id;
              return (
                <div
                  key={srv.id}
                  className={`rounded-3xl border overflow-hidden transition shadow-lg ${
                    isLight
                      ? "bg-white border-rose-200/90"
                      : "bg-[#1a1017] border-rose-900/40 hover:border-rose-500/40"
                  }`}
                >
                  {srv.imageUrl && (
                    <div className="relative h-48 w-full bg-rose-950/40 overflow-hidden">
                      <img
                        src={srv.imageUrl}
                        alt={srv.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-rose-200 backdrop-blur-md border border-rose-400/30">
                          {srv.category}
                        </span>
                        {srv.featured && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-zinc-950 shadow">
                            ⭐ Mais Pedido
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <h2 className="text-base font-black text-white drop-shadow">
                          {srv.name}
                        </h2>
                        <span className="px-3 py-1 rounded-xl bg-rose-500 text-zinc-950 font-black text-sm shadow-lg">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(srv.price)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-3.5">
                    {!srv.imageUrl && (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-rose-400">
                            {srv.category}
                          </span>
                          <h2 className="text-base font-black">{srv.name}</h2>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black text-sm">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(srv.price)}
                        </span>
                      </div>
                    )}

                    <p
                      className={`text-xs leading-relaxed ${
                        isLight ? "text-stone-600" : "text-rose-200/80"
                      }`}
                    >
                      {srv.description ||
                        "Procedimento realizado com técnica exclusiva, isolamento perfeito e materiais premium."}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-500/10">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          isLight ? "text-stone-600" : "text-rose-300/80"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Duração: {srv.duration}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mapping incluso</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => handleSelectForBooking(srv.id)}
                        disabled={bookingId !== null}
                        className="col-span-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-400 via-rose-300 to-amber-200 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-98 transition"
                      >
                        {isBookingThis ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Abrindo Agenda...</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4" />
                            <span>Agendar Este</span>
                          </>
                        )}
                      </button>

                      <a
                        href={getWhatsAppDoubtUrl(srv.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          isLight
                            ? "border-rose-200 text-stone-700 hover:bg-rose-50"
                            : "border-rose-900/50 text-rose-200 hover:bg-rose-950/50"
                        }`}
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>Dúvida</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
