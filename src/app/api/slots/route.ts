import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureSeedData } from "@/lib/prisma";


function timeToMinutes(t: string): number {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  try {
    await ensureSeedData();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    const config = await prisma.studioConfig.findUnique({ where: { id: 1 } });
    const allSlots: string[] = JSON.parse(config?.availableSlotsJson || "[]");
    const minAdvanceHours = config?.minAdvanceHours ?? 1;

    const blocks = await prisma.scheduleBlock.findMany({
      where: { date },
    });

    const fullDayBlock = blocks.find((b) => b.type === "dia");
    if (fullDayBlock) {
      return NextResponse.json({
        date,
        isFullDayBlocked: true,
        blockReason: fullDayBlock.reason || "Agenda fechada neste dia",
        slots: [],
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        date,
        status: { in: ["agendado", "concluido"] },
      },
    });

    const bookedTimes = new Set(appointments.map((a) => a.time));

    // Calculate current date/time in Brazil timezone (-03:00)
    const now = new Date();
    const brFormatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = brFormatter.format(now).split(" ");
    const todayStr = parts[0];
    const currentTimeStr = parts[1];
    const currentMinutes = timeToMinutes(currentTimeStr);

    if (date < todayStr) {
      return NextResponse.json({
        date,
        isFullDayBlocked: true,
        blockReason: "Esta data já passou.",
        slots: [],
      });
    }

    const slots = allSlots
      .slice()
      .sort()
      .map((time) => {
        const slotMin = timeToMinutes(time);
        const isBooked = bookedTimes.has(time);

        const isBlockedByPeriod = blocks.some((b) => {
          if (b.type !== "horario") return false;
          const start = timeToMinutes(b.startTime);
          const end = timeToMinutes(b.endTime);
          return slotMin >= start && slotMin < end;
        });

        let isPastAdvance = false;
        if (date === todayStr) {
          isPastAdvance = slotMin < currentMinutes + minAdvanceHours * 60;
        }

        const available = !isBooked && !isBlockedByPeriod && !isPastAdvance;
        let reason = "";
        if (isBooked) reason = "Ocupado";
        else if (isBlockedByPeriod) reason = "Indisponível";
        else if (isPastAdvance) reason = "Horário encerrado";

        return {
          time,
          available,
          reason,
        };
      });

    return NextResponse.json({
      date,
      isFullDayBlocked: false,
      blockReason: "",
      slots,
    });
  } catch (error) {
    console.error("Error in GET /api/slots:", error);
    return NextResponse.json(
      { error: "Erro ao consultar horários disponíveis" },
      { status: 500 }
    );
  }
}
