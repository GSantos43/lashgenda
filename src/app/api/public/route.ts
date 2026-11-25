import { NextResponse, connection } from "next/server";
import { prisma, ensureSeedData } from "@/lib/prisma";

export async function GET() {
  await connection();
  try {
    await ensureSeedData();

    const config = await prisma.studioConfig.findUnique({ where: { id: 1 } });
    const links = await prisma.linkItem.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    const blocks = await prisma.scheduleBlock.findMany({
      orderBy: { date: "asc" },
    });

    if (!config) {
      return NextResponse.json({ error: "Configuração não encontrada" }, { status: 404 });
    }

    const safeConfig = {
      id: config.id,
      studioName: config.studioName,
      professionalName: config.professionalName,
      tagline: config.tagline,
      bio: config.bio,
      address: config.address,
      whatsapp: config.whatsapp,
      instagram: config.instagram,
      logoUrl: config.logoUrl,
      coverUrl: config.coverUrl,
      badges: JSON.parse(config.badgesJson || "[]"),
      themeMode: config.themeMode,
      minAdvanceHours: config.minAdvanceHours,
      availableSlots: JSON.parse(config.availableSlotsJson || "[]"),
      portfolio: JSON.parse(config.portfolioJson || "[]"),
      whatsappMessageTemplate: config.whatsappMessageTemplate,
    };

    return NextResponse.json({
      config: safeConfig,
      links,
      services,
      blocks,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/public:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados do estúdio" },
      { status: 500 }
    );
  }
}
