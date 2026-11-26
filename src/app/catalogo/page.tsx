"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MessageCircle,
  Sparkles,
  Loader2,
  Search,
  ArrowRight,
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
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [enterKey, setEnterKey] = useState(0);

  useEffect(() => {
    setBookingId(null);
    setEnterKey((k) => k + 1);
  }, [pathname]);

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
    ...Array.from(
      new Set(services.map((s) => s.category || "Extensão de Cílios"))
    ),
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
    setTimeout(() => setBookingId(null), 500);
  };

  const getWhatsAppDoubtUrl = (serviceName: string) => {
    const rawPhone = (config?.whatsapp || "5577988350460").replace(/\D/g, "");
    const phone =
      !rawPhone || rawPhone === "11999999999" || rawPhone === "5511999999999"
        ? "5577988350460"
        : rawPhone;
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const text = encodeURIComponent(
      `Olá! Estava vendo o catálogo do ${config?.studioName || "estúdio"} e gostaria de saber mais sobre o procedimento: *${serviceName}* ✨`
    );
    return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`;
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-[#111111] animate-spin mb-3" />
        <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">
          Carregando Catálogo de Procedimentos...
        </p>
      </div>
    );
  }

  return (
    <div
      key={enterKey}
      className="min-h-screen bg-[#FAF8F5] text-[#111111] pb-16 font-sans"
    >
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF8F5]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md px-6 py-5 border-b border-[#EFECE6] flex items-center justify-between animate-card">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/")}
              aria-label="Voltar"
              className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-[#111111] hover:bg-black/5 smooth-press cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
            </button>

            <h1 className="text-[21px] font-extrabold tracking-tight text-[#111111] leading-tight">
              Catálogo
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/agendar")}
            className="px-5 py-2.5 rounded-full bg-[#09090B] hover:bg-zinc-800 text-white text-[13px] font-bold flex items-center gap-2 shadow-xs smooth-press cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar</span>
          </button>
        </header>

        <main className="px-5 pt-4 space-y-5">
          {/* Intro Banner in Blush Pink (#EADCE0) */}
          <div className="p-5 rounded-[24px] bg-[#EADCE0] space-y-1.5 animate-card smooth-card">
            <div className="inline-flex items-center gap-1.5 text-[#574147] text-[10px] font-bold uppercase tracking-[0.08em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PROCEDIMENTOS • {config?.professionalName}</span>
            </div>
            <h2 className="text-[18px] font-extrabold text-[#111111] tracking-tight">
              Escolha o Olhar Perfeito
            </h2>
            <p className="text-xs text-[#4A3E42] leading-relaxed">
              Todos os procedimentos incluem avaliação personalizada (visagismo)
              e fios tecnológicos hipoalergênicos de alta retenção.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div
            className="space-y-3 animate-card"
            style={{ animationDelay: "40ms" }}
          >
            <div className="relative">
              <Search className="w-4 h-4 text-[#78716C] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar técnica (ex: Clássico, Volume, Fox Eyes)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-[18px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-xs font-medium text-[#111111] placeholder:text-[#A8A29E] focus:outline-none"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap smooth-press cursor-pointer ${
                      active
                        ? "bg-[#09090B] text-white shadow-xs"
                        : "bg-[#F3EFEA] text-[#57534E] hover:bg-[#E7E2DA]"
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
            <div className="p-8 rounded-[24px] bg-white text-center space-y-2 shadow-2xs animate-card">
              <p className="text-sm font-bold text-[#111111]">
                Nenhum procedimento encontrado.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("Todos");
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-[#78716C] underline cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div key={selectedCategory} className="space-y-3.5">
              {filteredServices.map((srv, idx) => {
                const isBookingThis = bookingId === srv.id;
                return (
                  <div
                    key={srv.id}
                    style={{ animationDelay: `${110 + idx * 75}ms` }}
                    className="p-4 rounded-[24px] bg-white shadow-[0_2px_14px_rgba(0,0,0,0.025)] space-y-3.5 animate-card smooth-card"
                  >
                    <div className="flex items-start gap-3.5">
                      {srv.imageUrl && (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F3EFEA] shrink-0">
                          <img
                            src={srv.imageUrl}
                            alt={srv.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#78716C]">
                            {srv.category}
                          </span>
                          {srv.featured && (
                            <span className="px-2 py-0.5 rounded-full bg-[#EADCE0] text-[#574147] text-[9px] font-extrabold uppercase">
                              Mais Pedido
                            </span>
                          )}
                        </div>

                        <h3 className="text-[16px] font-extrabold text-[#111111] leading-snug mt-0.5">
                          {srv.name}
                        </h3>

                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[15px] font-extrabold text-[#111111]">
                            {formatBRL(srv.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#57534E] leading-relaxed">
                      {srv.description ||
                        "Procedimento realizado com técnica exclusiva, isolamento perfeito e materiais hipoalergênicos."}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleSelectForBooking(srv.id)}
                        disabled={bookingId !== null}
                        className="flex-1 py-3.5 px-4 rounded-[16px] bg-[#09090B] hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-between shadow-xs smooth-press cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {isBookingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Calendar className="w-4 h-4" />
                          )}
                          <span>
                            {isBookingThis
                              ? "Abrindo..."
                              : "Selecionar Procedimento"}
                          </span>
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <a
                        href={getWhatsAppDoubtUrl(srv.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Tirar dúvida no WhatsApp"
                        className="py-3.5 px-3.5 rounded-[16px] bg-[#F3EFEA] hover:bg-[#E7E2DA] text-[#111111] text-xs font-bold flex items-center justify-center gap-1.5 smooth-press shrink-0"
                      >
                        <MessageCircle className="w-4 h-4 text-[#10B981]" />
                        <span>Dúvida</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
