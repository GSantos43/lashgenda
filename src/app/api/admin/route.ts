import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma, ensureSeedData, normalizePhone } from "@/lib/prisma";

interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const MAX_LOGIN_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const globalForRateLimit = globalThis as unknown as {
  __adminLoginAttempts?: Map<string, LoginAttemptRecord>;
};

const loginAttemptsMap =
  globalForRateLimit.__adminLoginAttempts ??
  (globalForRateLimit.__adminLoginAttempts = new Map<
    string,
    LoginAttemptRecord
  >());

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip")?.trim() || "local-client";
}

function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}


async function checkAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("lash_admin_session")?.value;
  await ensureSeedData();
  if (!token) return false;
  const config = await prisma.studioConfig.findUnique({ where: { id: 1 } });
  if (!config) return false;
  const expected = Buffer.from(`${config.adminUsername}:${config.adminPassword}`).toString("base64");
  return token === expected;
}

export async function GET(req: NextRequest) {
  try {
    const isAuth = await checkAuth(req);
    if (!isAuth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const config = await prisma.studioConfig.findUnique({ where: { id: 1 } });
    const links = await prisma.linkItem.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    const services = await prisma.service.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    const appointments = await prisma.appointment.findMany({
      orderBy: [{ date: "desc" }, { time: "asc" }],
    });
    const blocks = await prisma.scheduleBlock.findMany({
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    const blockedClients = await prisma.blockedClient.findMany({
      orderBy: { createdAt: "desc" },
    });
    const whatsappEvents = await prisma.whatsappEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return NextResponse.json({
      authenticated: true,
      config: config
        ? {
            ...config,
            badges: JSON.parse(config.badgesJson || "[]"),
            availableSlots: JSON.parse(config.availableSlotsJson || "[]"),
            portfolio: JSON.parse(config.portfolioJson || "[]"),
          }
        : null,
      links,
      services,
      appointments,
      blocks,
      blockedClients,
      whatsappEvents,
    });
  } catch (error) {
    console.error("Error in GET /api/admin:", error);
    return NextResponse.json({ error: "Erro ao carregar painel admin" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const clientIp = getClientIp(req);
      const now = Date.now();
      const record = loginAttemptsMap.get(clientIp);

      if (record && record.lockedUntil > now) {
        const remainingMinutes = Math.ceil(
          (record.lockedUntil - now) / (60 * 1000)
        );
        return NextResponse.json(
          {
            error: `Muitas tentativas falhas. Tente novamente em ${remainingMinutes} min.`,
          },
          { status: 429 }
        );
      }

      const { username, password } = body;
      const config = await prisma.studioConfig.findUnique({ where: { id: 1 } });
      const inputUser = String(username || "").trim();
      const inputPass = String(password || "");
      const validUser = config
        ? safeCompare(inputUser, config.adminUsername)
        : false;
      const validPass = config
        ? safeCompare(inputPass, config.adminPassword)
        : false;

      if (!config || !validUser || !validPass) {
        const prev =
          record && now - record.firstAttemptAt < ATTEMPT_WINDOW_MS
            ? record
            : { count: 0, firstAttemptAt: now, lockedUntil: 0 };
        const nextCount = prev.count + 1;
        const lockedUntil =
          nextCount >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;

        loginAttemptsMap.set(clientIp, {
          count: nextCount,
          firstAttemptAt: prev.firstAttemptAt,
          lockedUntil,
        });

        if (lockedUntil > now) {
          return NextResponse.json(
            {
              error:
                "Limite de tentativas excedido. Acesso bloqueado temporariamente por 15 minutos.",
            },
            { status: 429 }
          );
        }

        const remaining = MAX_LOGIN_ATTEMPTS - nextCount;
        return NextResponse.json(
          {
            error:
              remaining <= 2
                ? `Usuário ou senha incorretos. (${remaining} tentativa${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"})`
                : "Usuário ou senha incorretos.",
          },
          { status: 401 }
        );
      }

      loginAttemptsMap.delete(clientIp);

      const token = Buffer.from(
        `${config.adminUsername}:${config.adminPassword}`
      ).toString("base64");
      const res = NextResponse.json({
        success: true,
        message: "Login realizado com sucesso!",
      });
      res.cookies.set("lash_admin_session", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 14, // 14 days
        sameSite: "lax",
      });
      return res;
    }

    if (action === "logout") {
      const res = NextResponse.json({ success: true });
      res.cookies.delete("lash_admin_session");
      return res;
    }

    // All subsequent actions require authentication
    const isAuth = await checkAuth(req);
    if (!isAuth) {
      return NextResponse.json(
        { error: "Sessão expirada. Faça login novamente." },
        { status: 401 }
      );
    }

    if (action === "update_config") {
      const {
        studioName,
        professionalName,
        tagline,
        bio,
        address,
        whatsapp,
        instagram,
        logoUrl,
        coverUrl,
        badges,
        themeMode,
        minAdvanceHours,
        availableSlots,
        portfolio,
        whatsappMessageTemplate,
        adminUsername,
        adminPassword,
      } = body;

      const current = await prisma.studioConfig.findUnique({ where: { id: 1 } });
      const newUsername = adminUsername?.trim() || current?.adminUsername || "admin";
      const newPassword = adminPassword || current?.adminPassword || "123456";

      await prisma.studioConfig.update({
        where: { id: 1 },
        data: {
          studioName: studioName ?? current?.studioName,
          professionalName: professionalName ?? current?.professionalName,
          tagline: tagline ?? current?.tagline,
          bio: bio ?? current?.bio,
          address: address ?? current?.address,
          whatsapp: whatsapp ? normalizePhone(whatsapp) : current?.whatsapp,
          instagram: instagram ?? current?.instagram,
          logoUrl: logoUrl ?? current?.logoUrl,
          coverUrl: coverUrl ?? current?.coverUrl,
          badgesJson: Array.isArray(badges)
            ? JSON.stringify(badges)
            : current?.badgesJson,
          themeMode: themeMode ?? current?.themeMode,
          minAdvanceHours:
            typeof minAdvanceHours === "number"
              ? minAdvanceHours
              : current?.minAdvanceHours,
          availableSlotsJson: Array.isArray(availableSlots)
            ? JSON.stringify(availableSlots.slice().sort())
            : current?.availableSlotsJson,
          portfolioJson: Array.isArray(portfolio)
            ? JSON.stringify(portfolio)
            : current?.portfolioJson,
          whatsappMessageTemplate:
            whatsappMessageTemplate ?? current?.whatsappMessageTemplate,
          adminUsername: newUsername,
          adminPassword: newPassword,
        },
      });

      const token = Buffer.from(`${newUsername}:${newPassword}`).toString("base64");
      const res = NextResponse.json({
        success: true,
        message: "Configurações salvas com sucesso!",
      });
      res.cookies.set("lash_admin_session", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
        sameSite: "lax",
      });
      return res;
    }

    // Services CRUD
    if (action === "save_service") {
      const { id, name, category, description, price, duration, imageUrl, featured, active, order } =
        body.service;
      if (!name || price === undefined) {
        return NextResponse.json(
          { error: "Nome e preço do serviço são obrigatórios." },
          { status: 400 }
        );
      }

      if (id) {
        await prisma.service.update({
          where: { id: Number(id) },
          data: {
            name: name.trim(),
            category: category || "Extensão de Cílios",
            description: description || "",
            price: Number(price),
            duration: duration || "1h 30min",
            imageUrl: imageUrl || "",
            featured: Boolean(featured),
            active: active !== undefined ? Boolean(active) : true,
            order: Number(order || 0),
          },
        });
      } else {
        await prisma.service.create({
          data: {
            name: name.trim(),
            category: category || "Extensão de Cílios",
            description: description || "",
            price: Number(price),
            duration: duration || "1h 30min",
            imageUrl: imageUrl || "",
            featured: Boolean(featured),
            active: active !== undefined ? Boolean(active) : true,
            order: Number(order || 0),
          },
        });
      }
      return NextResponse.json({ success: true, message: "Procedimento salvo!" });
    }

    if (action === "delete_service") {
      await prisma.service.delete({ where: { id: Number(body.id) } });
      return NextResponse.json({ success: true, message: "Procedimento removido!" });
    }

    // Links CRUD
    if (action === "save_link") {
      const { id, title, subtitle, url, icon, highlight, active, order } = body.link;
      if (!title || !url) {
        return NextResponse.json(
          { error: "Título e URL/destino do botão são obrigatórios." },
          { status: 400 }
        );
      }
      if (id) {
        await prisma.linkItem.update({
          where: { id: Number(id) },
          data: {
            title: title.trim(),
            subtitle: subtitle || "",
            url: url.trim(),
            icon: icon || "sparkles",
            highlight: Boolean(highlight),
            active: active !== undefined ? Boolean(active) : true,
            order: Number(order || 0),
          },
        });
      } else {
        await prisma.linkItem.create({
          data: {
            title: title.trim(),
            subtitle: subtitle || "",
            url: url.trim(),
            icon: icon || "sparkles",
            highlight: Boolean(highlight),
            active: active !== undefined ? Boolean(active) : true,
            order: Number(order || 0),
          },
        });
      }
      return NextResponse.json({ success: true, message: "Botão do Linktree salvo!" });
    }

    if (action === "delete_link") {
      await prisma.linkItem.delete({ where: { id: Number(body.id) } });
      return NextResponse.json({ success: true, message: "Botão removido!" });
    }

    // Appointments management
    if (action === "update_appointment_status") {
      const { id, status, cancelReason } = body;
      await prisma.appointment.update({
        where: { id: Number(id) },
        data: {
          status,
          cancelReason: cancelReason || "",
          canceledBy: status === "cancelado" ? "profissional" : "",
        },
      });
      return NextResponse.json({
        success: true,
        message: "Status do agendamento atualizado!",
      });
    }

    if (action === "create_manual_appointment") {
      const {
        serviceId,
        date,
        time,
        clientName,
        clientPhone,
        clientAddress,
        clientNotes,
      } = body;
      const service = await prisma.service.findUnique({
        where: { id: Number(serviceId) },
      });
      if (!service) {
        return NextResponse.json({ error: "Serviço inválido" }, { status: 400 });
      }
      await prisma.appointment.create({
        data: {
          service: { connect: { id: service.id } },
          serviceName: service.name,
          price: service.price,
          duration: service.duration,
          date,
          time,
          clientName: clientName.trim(),
          clientPhone: normalizePhone(clientPhone),
          clientAddress: (clientAddress || "").trim(),
          clientNotes: clientNotes || "",
          status: "agendado",
        },
      });
      return NextResponse.json({
        success: true,
        message: "Agendamento manual criado!",
      });
    }

    if (action === "delete_appointment") {
      await prisma.appointment.delete({ where: { id: Number(body.id) } });
      return NextResponse.json({
        success: true,
        message: "Agendamento excluído permanentemente.",
      });
    }

    // Schedule Blocks / Folgas
    if (action === "add_block") {
      const { date, type, startTime, endTime, reason } = body;
      if (!date) {
        return NextResponse.json({ error: "Selecione a data do bloqueio." }, { status: 400 });
      }
      await prisma.scheduleBlock.create({
        data: {
          date,
          type: type || "dia",
          startTime: type === "horario" ? startTime || "12:00" : "",
          endTime: type === "horario" ? endTime || "14:00" : "",
          reason: reason || "Agenda fechada / Folga",
        },
      });
      return NextResponse.json({
        success: true,
        message: "Bloqueio de agenda registrado!",
      });
    }

    if (action === "delete_block") {
      await prisma.scheduleBlock.delete({ where: { id: Number(body.id) } });
      return NextResponse.json({
        success: true,
        message: "Bloqueio removido!",
      });
    }

    // Blocked Clients
    if (action === "block_client") {
      const phone = normalizePhone(body.phone || "");
      if (phone.length < 10) {
        return NextResponse.json(
          { error: "Informe um WhatsApp válido com DDD." },
          { status: 400 }
        );
      }
      await prisma.blockedClient.upsert({
        where: { phone },
        update: {
          name: body.name || "",
          reason: body.reason || "Bloqueada pela profissional",
        },
        create: {
          phone,
          name: body.name || "",
          reason: body.reason || "Bloqueada pela profissional",
        },
      });
      return NextResponse.json({
        success: true,
        message: "Número bloqueado para novos agendamentos!",
      });
    }

    if (action === "unblock_client") {
      await prisma.blockedClient.delete({ where: { id: Number(body.id) } });
      return NextResponse.json({
        success: true,
        message: "Cliente desbloqueada!",
      });
    }

    if (action === "clear_whatsapp_events") {
      await prisma.whatsappEvent.deleteMany({});
      return NextResponse.json({
        success: true,
        message: "Histórico de avisos limpo!",
      });
    }

    if (action === "mark_notification_read") {
      const { id } = body;
      if (id) {
        await prisma.whatsappEvent.update({
          where: { id: Number(id) },
          data: { read: true },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "mark_all_notifications_read") {
      await prisma.whatsappEvent.updateMany({
        where: { read: false },
        data: { read: true },
      });
      return NextResponse.json({
        success: true,
        message: "Todas as notificações marcadas como lidas!",
      });
    }

    return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/admin:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação administrativa" },
      { status: 500 }
    );
  }
}
