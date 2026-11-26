import { NextRequest, NextResponse } from "next/server";
import { prisma, normalizePhone, formatCurrencyBR } from "@/lib/prisma";


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phoneParam = searchParams.get("phone") || "";
  try {
    const phone = normalizePhone(phoneParam);

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: "Informe um número de WhatsApp válido com DDD (10 ou 11 dígitos)." },
        { status: 400 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        clientPhone: phone,
        status: "agendado",
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error in GET /api/appointments:", error);
    return NextResponse.json(
      { error: "Erro ao consultar agendamentos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      serviceId,
      date,
      time,
      clientName,
      clientPhone,
      clientAddress,
      clientNotes,
    } = body;

    if (!serviceId || !date || !time || !clientName || !clientPhone || !clientAddress?.trim()) {
      return NextResponse.json(
        {
          error:
            "Preencha todos os campos obrigatórios (procedimento, data, horário, nome, WhatsApp e endereço).",
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(clientPhone);
    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      return NextResponse.json(
        { error: "Informe um WhatsApp válido com DDD (ex: 11988887777)." },
        { status: 400 }
      );
    }

    // Check if client phone is blocked
    const blocked = await prisma.blockedClient.findUnique({
      where: { phone: normalizedPhone },
    });
    if (blocked) {
      return NextResponse.json(
        {
          error:
            "Não foi possível concluir o agendamento online para este número. Entre em contato diretamente pelo WhatsApp do estúdio.",
        },
        { status: 403 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service || !service.active) {
      return NextResponse.json(
        { error: "Procedimento selecionado não encontrado ou indisponível." },
        { status: 404 }
      );
    }

    // Check if schedule is blocked
    const blocks = await prisma.scheduleBlock.findMany({
      where: { date },
    });
    if (blocks.some((b) => b.type === "dia")) {
      return NextResponse.json(
        { error: "A agenda está fechada nesta data. Por favor, selecione outro dia." },
        { status: 409 }
      );
    }

    const [slotH, slotM] = time.split(":").map(Number);
    const slotMin = (slotH || 0) * 60 + (slotM || 0);
    const periodBlocked = blocks.some((b) => {
      if (b.type !== "horario") return false;
      const [sh, sm] = b.startTime.split(":").map(Number);
      const [eh, em] = b.endTime.split(":").map(Number);
      return slotMin >= sh * 60 + sm && slotMin < eh * 60 + em;
    });

    if (periodBlocked) {
      return NextResponse.json(
        { error: "Este horário foi bloqueado pela profissional. Escolha outro horário." },
        { status: 409 }
      );
    }

    // Check if slot is already booked
    const existing = await prisma.appointment.findFirst({
      where: {
        date,
        time,
        status: { in: ["agendado", "concluido"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Este horário acabou de ser reservado! Por favor, escolha outro horário disponível." },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        service: { connect: { id: service.id } },
        serviceName: service.name,
        price: service.price,
        duration: service.duration,
        date,
        time,
        clientName: clientName.trim(),
        clientPhone: normalizedPhone,
        clientAddress: (clientAddress || "").trim(),
        clientNotes: (clientNotes || "").trim(),
        status: "agendado",
      },
    });

    const formattedDate = date.split("-").reverse().join("/");
    const msg = `✨ *Novo Agendamento Confirmado!*\n\n👩 *Cliente:* ${clientName.trim()}\n💆‍♀️ *Procedimento:* ${service.name} (${formatCurrencyBR(service.price)})\n📅 *Data:* ${formattedDate} às *${time}*\n📍 *Endereço (Domicílio):* ${(clientAddress || "").trim()}`;

    await prisma.whatsappEvent.create({
      data: {
        type: "novo_agendamento",
        appointmentId: appointment.id,
        clientName: clientName.trim(),
        clientPhone: normalizedPhone,
        serviceName: service.name,
        date,
        time,
        message: msg,
      },
    });

    return NextResponse.json({
      appointment,
      message: "Agendamento confirmado com sucesso!",
    });
  } catch (error) {
    console.error("Error in POST /api/appointments:", error);
    return NextResponse.json(
      { error: "Erro interno ao registrar o agendamento." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, clientPhone, cancelReason } = body;

    if (!id || !clientPhone) {
      return NextResponse.json(
        { error: "Dados insuficientes para cancelar o agendamento." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(clientPhone);
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });

    if (!appointment || appointment.clientPhone !== normalizedPhone) {
      return NextResponse.json(
        { error: "Agendamento não encontrado para este número de WhatsApp." },
        { status: 404 }
      );
    }

    if (appointment.status !== "agendado") {
      return NextResponse.json(
        { error: "Este agendamento já foi cancelado ou concluído." },
        { status: 400 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "cancelado",
        cancelReason: (cancelReason || "Cancelado pela cliente via site").trim(),
        canceledBy: "cliente",
      },
    });

    const formattedDate = appointment.date.split("-").reverse().join("/");
    await prisma.whatsappEvent.create({
      data: {
        type: "cancelamento_cliente",
        appointmentId: appointment.id,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        serviceName: appointment.serviceName,
        date: appointment.date,
        time: appointment.time,
        message: `⚠️ *Agendamento Desmarcado pela Cliente*\nCliente: ${appointment.clientName}\nProcedimento: ${appointment.serviceName}\nData: ${formattedDate} às ${appointment.time}\nMotivo: ${updated.cancelReason}`,
      },
    });

    return NextResponse.json({
      appointment: updated,
      message: "Horário desmarcado com sucesso.",
    });
  } catch (error) {
    console.error("Error in PATCH /api/appointments:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar agendamento." },
      { status: 500 }
    );
  }
}
