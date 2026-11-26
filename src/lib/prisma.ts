import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

export function formatPhoneBR(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return phone;
}

export function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export async function ensureSeedData() {
  const existingConfig = await prisma.studioConfig.findUnique({
    where: { id: 1 },
  });

  if (!existingConfig) {
    await prisma.studioConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        studioName: "Isabele Lash",
        professionalName: "Camila Andrade",
        tagline: "Especialista em Extensão de Cílios & Olhar Marcante ✨",
        bio: "Transformando olhares com técnicas personalizadas, fios tecnológicos de alta retenção e máximo conforto. Atendimento exclusivo com hora marcada.",
        address: "Av. Paulista, 1000 - Sala 402, Jardins - São Paulo/SP",
        whatsapp: "5577988350460",
        instagram: "@bellalash.studio",
        logoUrl: "/isa.png",
        coverUrl:
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&auto=format&fit=crop&q=80",
        badgesJson: JSON.stringify([
          "❄️ Ambiente Climatizado",
          "☕ Cappuccino & Mimo",
          "📶 Wi-Fi Grátis",
          "✨ Fios Tecnológicos Premium",
        ]),
        themeMode: "light-rose",
        minAdvanceHours: 1,
        availableSlotsJson: JSON.stringify([
          "09:30",
          "11:00",
          "12:00",
          "13:30",
          "15:15",
          "17:00",
          "18:30",
          "19:45",
        ]),
        portfolioJson: JSON.stringify([
          "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
        ]),
        whatsappMessageTemplate:
          "Olá Camila! Vim pelo seu link da bio e gostaria de tirar uma dúvida sobre os procedimentos de cílios ✨",
        adminUsername: "admin",
        adminPassword: "123456",
      },
    });
  }

  const linksCount = await prisma.linkItem.count();
  if (linksCount === 0) {
    await prisma.linkItem.createMany({
      data: [
        {
          title: "📅 Agendar Meu Horário Online",
          subtitle: "Escolha o procedimento, dia e horário em segundos",
          url: "/agendar",
          icon: "calendar",
          highlight: true,
          active: true,
          order: 1,
        },
        {
          title: "✨ Ver Catálogo de Procedimentos",
          subtitle: "Fotos, valores, durabilidade e detalhes de cada técnica",
          url: "/catalogo",
          icon: "book-open",
          highlight: false,
          active: true,
          order: 2,
        },
        {
          title: "💬 Falar Direto no WhatsApp",
          subtitle: "Tire suas dúvidas ou solicite avaliação personalizada",
          url: "whatsapp:default",
          icon: "message-circle",
          highlight: false,
          active: true,
          order: 3,
        },
        {
          title: "📋 Consultar ou Remarcar Meu Horário",
          subtitle: "Já agendou? Consulte seus horários pelo WhatsApp",
          url: "/agendar?consultar=1",
          icon: "clock",
          highlight: false,
          active: true,
          order: 4,
        },
        {
          title: "📍 Como Chegar no Estúdio",
          subtitle: "Av. Paulista, 1000 - Sala 402, Jardins - São Paulo/SP",
          url: "https://maps.google.com/?q=Av.+Paulista+1000+Sao+Paulo",
          icon: "map-pin",
          highlight: false,
          active: false,
          order: 5,
        },
      ],
    });
  }

  const servicesCount = await prisma.service.count();
  if (servicesCount === 0) {
    await prisma.service.createMany({
      data: [
        {
          name: "Volume Brasileiro (Fio Y)",
          category: "Extensão de Cílios",
          description:
            "O queridinho do estúdio! Proporciona volume moderado com acabamento rendado, leveza extrema e excelente retenção. Ideal para quem busca olhar marcante sem perder a naturalidade.",
          price: 160,
          duration: "1h 45min",
          imageUrl:
            "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=700&auto=format&fit=crop&q=80",
          featured: true,
          active: true,
          order: 1,
        },
        {
          name: "Volume Egípcio (3D / Fio W)",
          category: "Extensão de Cílios",
          description:
            "Mais preenchimento e densidade! Feito com fios tecnológicos em formato W que entregam um efeito mais escuro e glamouroso na raiz com pontas delicadas.",
          price: 185,
          duration: "2h 00min",
          imageUrl:
            "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=700&auto=format&fit=crop&q=80",
          featured: true,
          active: true,
          order: 2,
        },
        {
          name: "Fox Eyes / Efeito Delineado",
          category: "Extensão de Cílios",
          description:
            "Mapping exclusivo que alonga o canto externo dos olhos, criando um efeito lifting sensual e olhar felino irresistível.",
          price: 195,
          duration: "2h 00min",
          imageUrl:
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&auto=format&fit=crop&q=80",
          featured: true,
          active: true,
          order: 3,
        },
        {
          name: "Clássico Fio a Fio",
          category: "Extensão de Cílios",
          description:
            "Técnica ultra natural onde aplicamos 1 fio sintético de seda sobre cada fio natural. Alonga e define como se você estivesse sempre de máscara de cílios.",
          price: 190,
          duration: "1h 30min",
          imageUrl:
            "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=700&auto=format&fit=crop&q=80",
          featured: true,
          active: true,
          order: 1,
        },
        {
          name: "Volume Russo / Mega Volume",
          category: "Extensão de Cílios",
          description:
            "Fans artesanais montados na hora para um olhar intensamente volumoso, denso e sofisticado.",
          price: 230,
          duration: "2h 30min",
          imageUrl:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80",
          featured: false,
          active: true,
          order: 5,
        },
        {
          name: "Manutenção Volume Brasileiro (até 21 dias)",
          category: "Manutenção",
          description:
            "Higienização completa, remoção dos fios crescidos e reposição total para renovar seu Volume Brasileiro. Necessário mínimo de 40% dos fios.",
          price: 110,
          duration: "1h 15min",
          imageUrl:
            "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=700&auto=format&fit=crop&q=80",
          featured: false,
          active: true,
          order: 6,
        },
        {
          name: "Manutenção Volume Egípcio / Fox Eyes (até 21 dias)",
          category: "Manutenção",
          description:
            "Manutenção periódica com higienização, remoção de fios com crescimento avançado e reposição completa do mapping.",
          price: 130,
          duration: "1h 30min",
          imageUrl:
            "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=700&auto=format&fit=crop&q=80",
          featured: false,
          active: true,
          order: 7,
        },
        {
          name: "Lash Lifting + Tintura + Nutrição",
          category: "Lash Lifting & Outros",
          description:
            "Curvatura, alinhamento, coloração preta e tratamento vitamínico nos seus próprios cílios naturais. Durabilidade de 6 a 8 semanas sem manutenção.",
          price: 140,
          duration: "1h 15min",
          imageUrl:
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&auto=format&fit=crop&q=80",
          featured: false,
          active: true,
          order: 8,
        },
        {
          name: "Remoção Segura + Spa dos Cílios",
          category: "Lash Lifting & Outros",
          description:
            "Remoção química suave com removedor em creme sem danificar os fios naturais, finalizada com higienização profunda.",
          price: 50,
          duration: "30 min",
          imageUrl:
            "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=700&auto=format&fit=crop&q=80",
          featured: false,
          active: true,
          order: 9,
        },
      ],
    });
  }

  const appointmentsCount = await prisma.appointment.count();
  if (appointmentsCount === 0) {
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    await prisma.appointment.createMany({
      data: [
        {
          serviceName: "Clássico Fio a Fio",
          price: 190,
          duration: "1h 30min",
          date: today,
          time: "09:30",
          clientName: "Beatriz Lima",
          clientPhone: "11988881111",
          status: "concluido",
        },
        {
          serviceName: "Manutenção 21 Dias",
          price: 120,
          duration: "1h 15min",
          date: today,
          time: "11:30",
          clientName: "Juliana Rossi",
          clientPhone: "11988882222",
          status: "agendado",
        },
        {
          serviceName: "Volume Russo • Fox Eyes",
          price: 300,
          duration: "2h 00min",
          date: today,
          time: "14:00",
          clientName: "Mariana Sampaio",
          clientPhone: "11988883333",
          status: "concluido",
        },
        {
          serviceName: "Lash Lifting + Nutrição",
          price: 150,
          duration: "1h 15min",
          date: today,
          time: "16:30",
          clientName: "Fernanda Costa",
          clientPhone: "11988884444",
          status: "agendado",
        },
        {
          serviceName: "Remoção + Lash Botox",
          price: 90,
          duration: "45 min",
          date: today,
          time: "18:00",
          clientName: "Gabriela Dias",
          clientPhone: "11988885555",
          status: "agendado",
        },
      ],
    });
  }
}
