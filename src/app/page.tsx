"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  MessageCircle,
  Share2,
  Loader2,
  MapPin,
} from "lucide-react";

interface StudioConfig {
  studioName: string;
  professionalName: string;
  tagline: string;
  bio: string;
  address: string;
  whatsapp: string;
  instagram: string;
  logoUrl: string;
  whatsappMessageTemplate: string;
}

interface LinkItem {
  id: number;
  title: string;
  subtitle: string;
  url: string;
  icon: string;
  highlight: boolean;
  active: boolean;
}

// Palette without beige (#C5A880 removed from button backgrounds):
// Primary:   #18181B (Dark zinc/charcoal -> Light text #FAF7F2)
// Secondary: #FCEEEF (Soft blush pink    -> Dark text #18181B)
// Neutral:   #FAF7F2 (Warm ivory/cream    -> Dark text #18181B)
// WhatsApp:  Pastel light green (#D8F3DC -> Dark text #18181B)
const BUTTON_PALETTE = [
  {
    bg: "bg-[#18181B] hover:bg-[#27272A]",
    text: "text-[#FAF7F2]",
    dots: "text-[#FAF7F2]/70 hover:bg-white/10",
    border: "border border-[#18181B]",
    shadow: "shadow-[0_6px_20px_rgba(24,24,27,0.16)]",
  },
  {
    bg: "bg-[#FCEEEF] hover:bg-[#f7dfe1]",
    text: "text-[#18181B]",
    dots: "text-[#18181B]/65 hover:bg-black/10",
    border: "border border-[#18181B]/15",
    shadow: "shadow-[0_4px_14px_rgba(24,24,27,0.05)]",
  },
  {
    bg: "bg-[#18181B] hover:bg-[#27272A]",
    text: "text-[#FCEEEF]",
    dots: "text-[#FCEEEF]/75 hover:bg-white/10",
    border: "border border-[#18181B]",
    shadow: "shadow-[0_6px_18px_rgba(24,24,27,0.14)]",
  },
  {
    bg: "bg-[#FAF7F2] hover:bg-[#f0ece4]",
    text: "text-[#18181B]",
    dots: "text-[#18181B]/65 hover:bg-black/10",
    border: "border border-[#18181B]/20",
    shadow: "shadow-[0_4px_12px_rgba(24,24,27,0.04)]",
  },
];

const WHATSAPP_BUTTON_STYLE = {
  bg: "bg-[#D8F3DC] hover:bg-[#c7ebd0]",
  text: "text-[#18181B]",
  dots: "text-[#18181B]/65 hover:bg-black/10",
  border: "border border-[#b7e4c7]",
  shadow: "shadow-[0_4px_14px_rgba(24,24,27,0.05)]",
};

export default function LinktreeHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/public", { cache: "no-store" });
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.links) setLinks(data.links);
      } catch (err) {
        console.error("Erro ao carregar Linktree:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getWhatsAppUrl = (customText?: string) => {
    const phone = (config?.whatsapp || "11999999999").replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const text = encodeURIComponent(
      customText ||
        config?.whatsappMessageTemplate ||
        "Olá! Vim pelo Link da Bio e gostaria de agendar um horário ✨"
    );
    return `https://wa.me/${fullPhone}?text=${text}`;
  };

  const getInstagramUrl = () => {
    const raw = (config?.instagram || "bellalash.studio")
      .replace(/^@/, "")
      .trim();
    if (raw.startsWith("http")) return raw;
    return `https://instagram.com/${raw}`;
  };

  const getMapsUrl = () => {
    const addr = config?.address || "Av. Paulista, 1000 - São Paulo";
    return `https://maps.google.com/?q=${encodeURIComponent(addr)}`;
  };

  const handleLinkClick = (item: LinkItem) => {
    const targetKey = `link-${item.id}`;
    setNavigatingTo(targetKey);

    if (item.url === "whatsapp:default" || item.url.startsWith("whatsapp:")) {
      window.open(getWhatsAppUrl(), "_blank", "noopener,noreferrer");
      setTimeout(() => setNavigatingTo(null), 500);
      return;
    }

    if (item.url.startsWith("http://") || item.url.startsWith("https://")) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      setTimeout(() => setNavigatingTo(null), 500);
      return;
    }

    router.push(item.url);
  };

  const handleShare = async (urlToShare?: string) => {
    const fullUrl = urlToShare
      ? urlToShare.startsWith("http")
        ? urlToShare
        : `${window.location.origin}${urlToShare}`
      : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: config?.studioName || "Linktree",
          url: fullUrl,
        });
      } else {
        await navigator.clipboard.writeText(fullUrl);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
      }
    } catch {
      // User dismissed share
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#18181B] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] shadow-lg flex items-center justify-center border border-[#C5A880]">
          <Loader2 className="w-6 h-6 text-[#18181B] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#18181B] bg-gradient-to-b from-[#18181B] via-[#1f1d1b] to-[#18181B] flex justify-center items-start sm:py-8 px-0 sm:px-4 font-sans text-[#18181B]">
      {copiedToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#18181B] text-[#FAF7F2] border border-[#C5A880] text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl">
          Link copiado!
        </div>
      )}

      {/* Main Linktree Card Container (Neutral #FAF7F2 with subtle Tertiary #C5A880 border & reduced border-radius) */}
      <main className="w-full max-w-[560px] min-h-screen sm:min-h-[820px] bg-[#FAF7F2] sm:rounded-2xl sm:border sm:border-[#C5A880]/40 sm:shadow-[0_20px_60px_rgba(0,0,0,0.45)] px-4 sm:px-6 pt-6 pb-14 flex flex-col items-center relative">
        {/* Top Share Button */}
        <div className="w-full flex justify-end mb-1">
          <button
            type="button"
            onClick={() => handleShare()}
            aria-label="Compartilhar"
            className="w-9 h-9 rounded-lg bg-[#FCEEEF] hover:bg-[#C5A880]/30 border border-[#C5A880]/40 flex items-center justify-center text-[#18181B] transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar with Tertiary (#C5A880) ring */}
        <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#C5A880] via-[#FCEEEF] to-[#C5A880] mb-3.5 shrink-0 shadow-md">
          <div className="w-full h-full rounded-full overflow-hidden bg-[#18181B]">
            <img
              src={
                config?.logoUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
              }
              alt={config?.studioName || "Perfil"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Profile Title */}
        <h1 className="text-[19px] font-semibold uppercase tracking-[0.12em] text-[#18181B] text-center leading-snug">
          {config?.studioName || "Studio Bella Lash"}
        </h1>

        {/* Social Icons Row right below the name */}
        <div className="flex items-center justify-center gap-3.5 mt-3 mb-7">
          {/* Website / Agenda */}
          <button
            type="button"
            onClick={() => router.push("/agendar")}
            title="Agendamento Online"
            className="w-9 h-9 rounded-lg bg-[#FCEEEF] hover:bg-[#18181B] text-[#18181B] hover:text-[#FAF7F2] border border-[#C5A880]/35 flex items-center justify-center transition-colors duration-150"
          >
            <Globe className="w-[18px] h-[18px] stroke-[2]" />
          </button>

          {/* Instagram SVG */}
          <a
            href={getInstagramUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
            className="w-9 h-9 rounded-lg bg-[#FCEEEF] hover:bg-[#18181B] text-[#18181B] hover:text-[#FAF7F2] border border-[#C5A880]/35 flex items-center justify-center transition-colors duration-150"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[18px] h-[18px]"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="w-9 h-9 rounded-lg bg-[#FCEEEF] hover:bg-[#18181B] text-[#18181B] hover:text-[#FAF7F2] border border-[#C5A880]/35 flex items-center justify-center transition-colors duration-150"
          >
            <MessageCircle className="w-[18px] h-[18px] stroke-[2]" />
          </a>

          {/* TikTok SVG */}
          <a
            href={getInstagramUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="TikTok"
            className="w-9 h-9 rounded-lg bg-[#FCEEEF] hover:bg-[#18181B] text-[#18181B] hover:text-[#FAF7F2] border border-[#C5A880]/35 flex items-center justify-center transition-colors duration-150"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-[17px] h-[17px]"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </a>

          {/* Location */}
          <a
            href={getMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Localização"
            className="w-9 h-9 rounded-lg bg-[#FCEEEF] hover:bg-[#18181B] text-[#18181B] hover:text-[#FAF7F2] border border-[#C5A880]/35 flex items-center justify-center transition-colors duration-150"
          >
            <MapPin className="w-[18px] h-[18px] stroke-[2]" />
          </a>
        </div>

        {/* Linktree Buttons List — nearly full width of the card, reduced border radius (rounded-xl), dynamic palette */}
        <div className="w-full space-y-3">
          {links.map((item, idx) => {
            const isBusy = navigatingTo === `link-${item.id}`;
            const cleanTitle = item.title.replace(
              /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u,
              ""
            );

            const isWhatsAppButton =
              item.url.startsWith("whatsapp:") ||
              item.url.includes("wa.me") ||
              item.title.toLowerCase().includes("whatsapp");

            const style = isWhatsAppButton
              ? WHATSAPP_BUTTON_STYLE
              : item.highlight
              ? BUTTON_PALETTE[0]
              : BUTTON_PALETTE[idx % BUTTON_PALETTE.length];

            return (
              <div
                key={item.id}
                onClick={() => handleLinkClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleLinkClick(item);
                }}
                className={`w-full min-h-[58px] rounded-xl px-6 py-3.5 flex items-center justify-center relative cursor-pointer transition-all duration-150 select-none active:scale-[0.99] ${style.bg} ${style.text} ${style.border} ${style.shadow}`}
              >
                <span className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.1em] text-center leading-snug">
                  {isBusy ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ABRINDO...</span>
                    </span>
                  ) : (
                    cleanTitle
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
