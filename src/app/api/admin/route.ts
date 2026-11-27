import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { prisma, ensureSeedData, normalizePhone } from "@/lib/prisma";

export interface StoredPasskey {
  id: string;
  publicKey: string; // base64url
  counter: number;
  deviceType?: "singleDevice" | "multiDevice";
  backedUp?: boolean;
  transports?: string[];
  name: string;
  createdAt: string;
}

interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const MAX_LOGIN_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RECOVERY_TTL_MS = 10 * 60 * 1000; // 10 minutes

const globalForRateLimit = globalThis as unknown as {
  __adminLoginAttempts?: Map<string, LoginAttemptRecord>;
  __webauthnChallenges?: Map<
    string,
    { challenge: string; expiresAt: number; role?: "admin" | "superadmin" }
  >;
  __passwordRecoveryCodes?: Map<
    string,
    {
      code: string;
      expiresAt: number;
      attempts: number;
      role: "admin" | "superadmin";
    }
  >;
};

const loginAttemptsMap =
  globalForRateLimit.__adminLoginAttempts ??
  (globalForRateLimit.__adminLoginAttempts = new Map<
    string,
    LoginAttemptRecord
  >());

const webauthnChallengesMap =
  globalForRateLimit.__webauthnChallenges ??
  (globalForRateLimit.__webauthnChallenges = new Map<
    string,
    { challenge: string; expiresAt: number; role?: "admin" | "superadmin" }
  >());

const passwordRecoveryMap =
  globalForRateLimit.__passwordRecoveryCodes ??
  (globalForRateLimit.__passwordRecoveryCodes = new Map<
    string,
    {
      code: string;
      expiresAt: number;
      attempts: number;
      role: "admin" | "superadmin";
    }
  >());

function maskEmail(email: string): string {
  const clean = (email || "").trim();
  const [userPart, domainPart] = clean.split("@");
  if (!userPart || !domainPart) return "";
  const visible =
    userPart.length <= 2
      ? userPart[0] || "*"
      : `${userPart.slice(0, 2)}${"*".repeat(Math.min(5, userPart.length - 2))}`;
  return `${visible}@${domainPart}`;
}

async function sendRecoveryEmail(params: {
  to: string;
  studioName: string;
  subject: string;
  html: string;
  text: string;
  config: {
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpUser?: string | null;
    smtpPass?: string | null;
  };
}) {
  const host = (
    params.config.smtpHost ||
    process.env.SMTP_HOST ||
    "smtp.gmail.com"
  ).trim();
  const port = Number(params.config.smtpPort || process.env.SMTP_PORT || 465);
  const rawUser = (
    params.config.smtpUser ||
    process.env.SMTP_USER ||
    ""
  ).trim();
  const user = rawUser.includes("@") ? rawUser : params.to.trim();
  const pass = (
    params.config.smtpPass ||
    process.env.SMTP_PASS ||
    ""
  ).replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error(
      "Credenciais SMTP não configuradas. Configure o e-mail e Senha de App nas configurações do painel (ou no arquivo .env)."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"${params.studioName || "Painel Executivo"}" <${user}>`,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

function parsePasskeys(rawJson?: string | null): StoredPasskey[] {
  if (!rawJson) return [];
  try {
    const parsed = JSON.parse(rawJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getRpIdAndOrigin(req: NextRequest): { rpID: string; origin: string } {
  const originHeader = req.headers.get("origin");
  const hostHeader =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";
  const protoHeader =
    req.headers.get("x-forwarded-proto") ||
    (hostHeader.startsWith("localhost") || hostHeader.startsWith("127.0.0.1")
      ? "http"
      : "https");

  const origin = originHeader || `${protoHeader}://${hostHeader}`;
  let rpID = hostHeader.split(":")[0];
  try {
    rpID = new URL(origin).hostname;
  } catch {
    // fallback to hostHeader without port
  }
  return { rpID, origin };
}

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


interface FullStudioConfigRow {
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
  badgesJson: string;
  themeMode: string;
  minAdvanceHours: number;
  availableSlotsJson: string;
  portfolioJson: string;
  whatsappMessageTemplate: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail?: string;
  superAdminUsername?: string;
  superAdminPassword?: string;
  superAdminEmail?: string;
  superAdminPasskeysJson?: string;
  superAdminRequire2FA?: number | boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  passkeysJson?: string;
  requirePasskey2FA?: number | boolean;
}

async function getStudioConfigRow(): Promise<FullStudioConfigRow | null> {
  const rows = await prisma.$queryRawUnsafe<FullStudioConfigRow[]>(
    `SELECT * FROM "StudioConfig" WHERE "id" = 1 LIMIT 1`
  );
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    superAdminUsername: row.superAdminUsername || "fr4nce",
    superAdminPassword: row.superAdminPassword || "yeshua77377",
    superAdminEmail: row.superAdminEmail || "guilhermefrance9@gmail.com",
    requirePasskey2FA: Boolean(row.requirePasskey2FA),
    superAdminRequire2FA: Boolean(row.superAdminRequire2FA),
  };
}

function buildSessionToken(
  role: "admin" | "superadmin",
  user: string,
  pass: string
): string {
  return Buffer.from(`${role}:${user}:${pass}`).toString("base64");
}

async function getAuthRole(
  req: NextRequest
): Promise<"admin" | "superadmin" | null> {
  const token = req.cookies.get("lash_admin_session")?.value;
  await ensureSeedData();
  if (!token) return null;
  const config = await getStudioConfigRow();
  if (!config) return null;

  const expectedAdmin = buildSessionToken(
    "admin",
    config.adminUsername,
    config.adminPassword
  );
  const legacyAdmin = Buffer.from(
    `${config.adminUsername}:${config.adminPassword}`
  ).toString("base64");

  if (token === expectedAdmin || token === legacyAdmin) {
    return "admin";
  }

  const superUser = config.superAdminUsername || "fr4nce";
  const superPass = config.superAdminPassword || "yeshua77377";
  const expectedSuper = buildSessionToken("superadmin", superUser, superPass);

  if (token === expectedSuper) {
    return "superadmin";
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const role = await getAuthRole(req);
    const config = await getStudioConfigRow();
    const adminPasskeys = parsePasskeys(config?.passkeysJson);
    const superPasskeys = parsePasskeys(config?.superAdminPasskeysJson);
    const allPasskeysCount = adminPasskeys.length + superPasskeys.length;

    if (!role) {
      const smtpConfigured = Boolean(
        (config?.smtpUser || process.env.SMTP_USER) &&
          (config?.smtpPass || process.env.SMTP_PASS)
      );

      return NextResponse.json(
        {
          authenticated: false,
          hasPasskeys: allPasskeysCount > 0,
          hasRecoveryEmail: smtpConfigured,
        },
        { status: 401 }
      );
    }

    const activePasskeys =
      role === "superadmin" ? superPasskeys : adminPasskeys;
    const activeRequire2FA =
      role === "superadmin"
        ? Boolean(config?.superAdminRequire2FA)
        : Boolean(config?.requirePasskey2FA);

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
      role,
      config: config
        ? {
            ...config,
            badges: JSON.parse(config.badgesJson || "[]"),
            availableSlots: JSON.parse(config.availableSlotsJson || "[]"),
            portfolio: JSON.parse(config.portfolioJson || "[]"),
            requirePasskey2FA: activeRequire2FA,
            adminRequirePasskey2FA: Boolean(config.requirePasskey2FA),
            superAdminRequire2FA: Boolean(config.superAdminRequire2FA),
            passkeys: activePasskeys.map((pk) => ({
              id: pk.id,
              name: pk.name,
              createdAt: pk.createdAt,
              deviceType: pk.deviceType,
              backedUp: pk.backedUp,
            })),
            adminPasskeys: adminPasskeys.map((pk) => ({
              id: pk.id,
              name: pk.name,
              createdAt: pk.createdAt,
            })),
            superAdminPasskeys: superPasskeys.map((pk) => ({
              id: pk.id,
              name: pk.name,
              createdAt: pk.createdAt,
            })),
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
      const config = await getStudioConfigRow();
      const inputUser = String(username || "").trim();
      const inputPass = String(password || "");

      let matchedRole: "admin" | "superadmin" | null = null;
      if (config) {
        const superUser = config.superAdminUsername || "fr4nce";
        const superPass = config.superAdminPassword || "yeshua77377";
        if (
          safeCompare(inputUser, superUser) &&
          safeCompare(inputPass, superPass)
        ) {
          matchedRole = "superadmin";
        } else if (
          safeCompare(inputUser, config.adminUsername) &&
          (safeCompare(inputPass, config.adminPassword) ||
            safeCompare(inputPass, `${config.adminPassword}.`) ||
            safeCompare(inputPass, config.adminPassword.replace(/\.$/, "")))
        ) {
          matchedRole = "admin";
        }
      }

      if (!config || !matchedRole) {
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

      if (matchedRole === "superadmin") {
        const superPasskeys = parsePasskeys(config.superAdminPasskeysJson);
        if (config.superAdminRequire2FA && superPasskeys.length > 0) {
          return NextResponse.json({
            require2FA: true,
            role: "superadmin",
            message:
              "Confirme sua identidade de SuperAdmin com Passkey (FaceID / Biometria).",
          });
        }

        const superUser = config.superAdminUsername || "fr4nce";
        const superPass = config.superAdminPassword || "yeshua77377";
        const token = buildSessionToken("superadmin", superUser, superPass);
        const res = NextResponse.json({
          success: true,
          role: "superadmin",
          username: superUser,
          displayName: superUser,
          message: "Login de SuperAdmin realizado com sucesso!",
        });
        res.cookies.set("lash_admin_session", token, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 14, // 14 days
          sameSite: "lax",
        });
        return res;
      }

      const storedPasskeys = parsePasskeys(config.passkeysJson);
      if (config.requirePasskey2FA && storedPasskeys.length > 0) {
        return NextResponse.json({
          require2FA: true,
          role: "admin",
          message: "Confirme sua identidade com Passkey (FaceID / Biometria).",
        });
      }

      const token = buildSessionToken(
        "admin",
        config.adminUsername,
        config.adminPassword
      );
      const res = NextResponse.json({
        success: true,
        role: "admin",
        username: config.adminUsername,
        displayName: config.professionalName || config.adminUsername,
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

    if (action === "passkey_login_options") {
      const config = await getStudioConfigRow();
      const adminPasskeys = parsePasskeys(config?.passkeysJson);
      const superPasskeys = parsePasskeys(config?.superAdminPasskeysJson);
      const targetRole = body.role as "admin" | "superadmin" | undefined;
      const combinedPasskeys =
        targetRole === "superadmin"
          ? superPasskeys
          : targetRole === "admin"
          ? adminPasskeys
          : [...superPasskeys, ...adminPasskeys];

      if (!config || combinedPasskeys.length === 0) {
        return NextResponse.json(
          {
            error:
              "Nenhuma Passkey cadastrada ainda. Entre com usuário e senha para cadastrar.",
          },
          { status: 400 }
        );
      }

      const { rpID } = getRpIdAndOrigin(req);
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: combinedPasskeys.map((pk) => ({
          id: pk.id,
          transports: pk.transports,
        })),
        userVerification: "preferred",
      });

      const clientIp = getClientIp(req);
      webauthnChallengesMap.set(`auth:${clientIp}`, {
        challenge: options.challenge,
        expiresAt: Date.now() + CHALLENGE_TTL_MS,
      });

      return NextResponse.json({ options });
    }

    if (action === "passkey_login_verify") {
      const clientIp = getClientIp(req);
      const challengeEntry = webauthnChallengesMap.get(`auth:${clientIp}`);
      if (!challengeEntry || challengeEntry.expiresAt < Date.now()) {
        return NextResponse.json(
          { error: "Desafio expirado. Tente novamente." },
          { status: 400 }
        );
      }

      const config = await getStudioConfigRow();
      if (!config) {
        return NextResponse.json(
          { error: "Configuração não encontrada." },
          { status: 404 }
        );
      }

      const adminPasskeys = parsePasskeys(config.passkeysJson);
      const superPasskeys = parsePasskeys(config.superAdminPasskeysJson);
      const credentialResponse = body.credential;

      const matchedSuper = superPasskeys.find(
        (pk) => pk.id === credentialResponse?.id
      );
      const matchedAdmin = adminPasskeys.find(
        (pk) => pk.id === credentialResponse?.id
      );
      const matched = matchedSuper || matchedAdmin;
      const matchedRole: "superadmin" | "admin" = matchedSuper
        ? "superadmin"
        : "admin";

      if (!matched) {
        return NextResponse.json(
          { error: "Passkey não reconhecida neste painel." },
          { status: 401 }
        );
      }

      const { rpID, origin } = getRpIdAndOrigin(req);
      const verification = await verifyAuthenticationResponse({
        response: credentialResponse,
        expectedChallenge: challengeEntry.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: matched.id,
          publicKey: new Uint8Array(
            Buffer.from(matched.publicKey, "base64url")
          ),
          counter: matched.counter,
          transports: matched.transports,
        },
        requireUserVerification: false,
      });

      if (!verification.verified) {
        return NextResponse.json(
          { error: "Falha ao verificar biometria / Passkey." },
          { status: 401 }
        );
      }

      webauthnChallengesMap.delete(`auth:${clientIp}`);
      loginAttemptsMap.delete(clientIp);

      if (matchedRole === "superadmin") {
        const updatedSuper = superPasskeys.map((pk) =>
          pk.id === matched.id
            ? {
                ...pk,
                counter:
                  verification.authenticationInfo.newCounter ?? pk.counter,
              }
            : pk
        );
        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "superAdminPasskeysJson" = ? WHERE "id" = 1`,
          JSON.stringify(updatedSuper)
        );

        const superUser = config.superAdminUsername || "fr4nce";
        const superPass = config.superAdminPassword || "yeshua77377";
        const token = buildSessionToken("superadmin", superUser, superPass);
        const res = NextResponse.json({
          success: true,
          role: "superadmin",
          username: superUser,
          displayName: superUser,
          message: "Autenticado como SuperAdmin via Passkey!",
        });
        res.cookies.set("lash_admin_session", token, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 14, // 14 days
          sameSite: "lax",
        });
        return res;
      }

      // Update counter for admin
      const updatedPasskeys = adminPasskeys.map((pk) =>
        pk.id === matched.id
          ? {
              ...pk,
              counter:
                verification.authenticationInfo.newCounter ?? pk.counter,
            }
          : pk
      );
      await prisma.$executeRawUnsafe(
        `UPDATE "StudioConfig" SET "passkeysJson" = ? WHERE "id" = 1`,
        JSON.stringify(updatedPasskeys)
      );

      const token = buildSessionToken(
        "admin",
        config.adminUsername,
        config.adminPassword
      );
      const res = NextResponse.json({
        success: true,
        role: "admin",
        username: config.adminUsername,
        displayName: config.professionalName || config.adminUsername,
        message: "Autenticado via Passkey!",
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

    if (action === "request_password_recovery") {
      const config = await getStudioConfigRow();
      if (!config) {
        return NextResponse.json(
          { error: "Configuração não encontrada." },
          { status: 404 }
        );
      }

      const identifier = String(body.identifier || "").trim().toLowerCase();
      if (!identifier) {
        return NextResponse.json(
          {
            error:
              "Informe o e-mail ou nome de usuário cadastrado na sua conta.",
          },
          { status: 400 }
        );
      }

      const adminUser = (config.adminUsername || "admin").trim().toLowerCase();
      const adminEmail = (config.adminEmail || "").trim().toLowerCase();
      const superUser = (config.superAdminUsername || "fr4nce")
        .trim()
        .toLowerCase();
      const superEmail = (config.superAdminEmail || "").trim().toLowerCase();

      let targetRole: "admin" | "superadmin" | null = null;
      let targetEmail = "";
      let targetUsername = "";

      if (
        identifier === superUser ||
        (superEmail && identifier === superEmail)
      ) {
        targetRole = "superadmin";
        targetEmail = (config.superAdminEmail || "").trim();
        targetUsername = config.superAdminUsername || "fr4nce";
      } else if (
        identifier === adminUser ||
        (adminEmail && identifier === adminEmail)
      ) {
        targetRole = "admin";
        targetEmail = (config.adminEmail || "").trim();
        targetUsername = config.adminUsername || "admin";
      }

      if (!targetRole) {
        return NextResponse.json(
          {
            error:
              "Nenhuma conta encontrada com esse e-mail ou usuário. Verifique os dados informados.",
          },
          { status: 404 }
        );
      }

      if (!targetEmail) {
        return NextResponse.json(
          {
            error:
              "Esta conta ainda não possui um e-mail de recuperação cadastrado. Peça ao gestor do sistema (SuperAdmin) para cadastrar seu e-mail.",
          },
          { status: 400 }
        );
      }

      // Generate 6-digit recovery OTP
      const code = String(crypto.randomInt(100000, 999999));
      const clientIp = getClientIp(req);
      passwordRecoveryMap.set(clientIp, {
        code,
        expiresAt: Date.now() + RECOVERY_TTL_MS,
        attempts: 0,
        role: targetRole,
      });

      const studioTitle = config.studioName || "Isabele Lash Designer";
      const roleLabel =
        targetRole === "superadmin"
          ? "Gestor do Sistema (SuperAdmin)"
          : "Painel da Profissional (Admin)";
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 28px 24px; background-color: #FAF8F5; border-radius: 24px; border: 1px solid #E5E0D8; color: #111111;">
          <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #78716C;">RECUPERAÇÃO DE ACESSO • ${roleLabel.toUpperCase()}</span>
          <h2 style="margin: 6px 0 12px; font-size: 20px; font-weight: 800; color: #111111;">${studioTitle}</h2>
          <p style="font-size: 13px; color: #57534E; line-height: 1.5; margin-bottom: 20px;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Utilize o código de 6 dígitos abaixo (válido por 10 minutos):
          </p>
          <div style="background-color: #141519; color: #FFFFFF; border-radius: 16px; padding: 18px; text-align: center; font-size: 28px; font-weight: 800; letter-spacing: 0.28em; margin-bottom: 18px;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #78716C; line-height: 1.5; margin: 0;">
            Seu usuário é: <strong style="color: #111111;">${targetUsername}</strong><br/>
            Se você não solicitou este código, ignore este e-mail com segurança.
          </p>
        </div>
      `;

      try {
        await sendRecoveryEmail({
          to: targetEmail,
          studioName: studioTitle,
          subject: `Código de Recuperação (${code}) - ${studioTitle}`,
          text: `Seu código de recuperação (${roleLabel} - ${studioTitle}) é: ${code}. Usuário: ${targetUsername}. Válido por 10 minutos.`,
          html,
          config,
        });
      } catch (err: unknown) {
        console.error("Erro ao enviar email de recuperação:", err);
        return NextResponse.json(
          {
            error:
              (err as { message?: string })?.message ||
              "Falha ao enviar e-mail pelo provedor SMTP do sistema.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        maskedEmail: maskEmail(targetEmail),
        role: targetRole,
        message: `Código enviado para ${maskEmail(targetEmail)}!`,
      });
    }

    if (action === "verify_password_recovery") {
      const clientIp = getClientIp(req);
      const entry = passwordRecoveryMap.get(clientIp);
      if (!entry || entry.expiresAt < Date.now()) {
        return NextResponse.json(
          {
            error:
              "Código expirado ou inexistente. Solicite um novo código por e-mail.",
          },
          { status: 400 }
        );
      }

      if (entry.attempts >= 5) {
        passwordRecoveryMap.delete(clientIp);
        return NextResponse.json(
          {
            error:
              "Muitas tentativas incorretas. Solicite um novo código por e-mail.",
          },
          { status: 429 }
        );
      }

      const inputCode = String(body.code || "").trim();
      const newPassword = String(body.newPassword || "").trim();
      const newUsername = String(body.newUsername || "").trim();
      const disablePasskey2FA = Boolean(body.disablePasskey2FA);

      if (!safeCompare(inputCode, entry.code)) {
        entry.attempts += 1;
        passwordRecoveryMap.set(clientIp, entry);
        return NextResponse.json(
          { error: "Código de 6 dígitos inválido." },
          { status: 401 }
        );
      }

      if (newPassword.length < 4) {
        return NextResponse.json(
          { error: "A nova senha deve ter pelo menos 4 caracteres." },
          { status: 400 }
        );
      }

      const config = await getStudioConfigRow();
      if (!config) {
        return NextResponse.json(
          { error: "Configuração não encontrada." },
          { status: 404 }
        );
      }

      const targetRole = entry.role;

      if (targetRole === "superadmin") {
        const finalSuperUser =
          newUsername || config.superAdminUsername || "fr4nce";
        if (disablePasskey2FA) {
          await prisma.$executeRawUnsafe(
            `UPDATE "StudioConfig" SET "superAdminUsername" = ?, "superAdminPassword" = ?, "superAdminRequire2FA" = 0 WHERE "id" = 1`,
            finalSuperUser,
            newPassword
          );
        } else {
          await prisma.$executeRawUnsafe(
            `UPDATE "StudioConfig" SET "superAdminUsername" = ?, "superAdminPassword" = ? WHERE "id" = 1`,
            finalSuperUser,
            newPassword
          );
        }

        passwordRecoveryMap.delete(clientIp);
        loginAttemptsMap.delete(clientIp);

        const token = buildSessionToken(
          "superadmin",
          finalSuperUser,
          newPassword
        );
        const res = NextResponse.json({
          success: true,
          role: "superadmin",
          username: finalSuperUser,
          displayName: finalSuperUser,
          message: "Senha de SuperAdmin redefinida e acesso liberado!",
        });
        res.cookies.set("lash_admin_session", token, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 14,
          sameSite: "lax",
        });
        return res;
      }

      const finalUsername = newUsername || config.adminUsername || "admin";

      if (disablePasskey2FA) {
        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "adminUsername" = ?, "adminPassword" = ?, "requirePasskey2FA" = 0 WHERE "id" = 1`,
          finalUsername,
          newPassword
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "adminUsername" = ?, "adminPassword" = ? WHERE "id" = 1`,
          finalUsername,
          newPassword
        );
      }

      passwordRecoveryMap.delete(clientIp);
      loginAttemptsMap.delete(clientIp);

      const token = buildSessionToken("admin", finalUsername, newPassword);
      const res = NextResponse.json({
        success: true,
        role: "admin",
        username: finalUsername,
        displayName: config.professionalName || finalUsername,
        message: "Senha redefinida e acesso liberado!",
      });
      res.cookies.set("lash_admin_session", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 14, // 14 days
        sameSite: "lax",
      });
      return res;
    }

    // All subsequent actions require authentication
    const authRole = await getAuthRole(req);
    if (!authRole) {
      return NextResponse.json(
        { error: "Sessão expirada. Faça login novamente." },
        { status: 401 }
      );
    }

    if (action === "passkey_register_options") {
      const config = await getStudioConfigRow();
      if (!config) {
        return NextResponse.json(
          { error: "Configuração não encontrada." },
          { status: 404 }
        );
      }

      const targetRole =
        authRole === "superadmin" && body.targetRole === "admin"
          ? "admin"
          : authRole;
      const storedPasskeys = parsePasskeys(
        targetRole === "superadmin"
          ? config.superAdminPasskeysJson
          : config.passkeysJson
      );
      const { rpID } = getRpIdAndOrigin(req);

      const options = await generateRegistrationOptions({
        rpName:
          targetRole === "superadmin"
            ? `${config.studioName || "LashGenda"} (SuperAdmin)`
            : config.studioName || "Isabele Lash Admin",
        rpID,
        userName:
          targetRole === "superadmin"
            ? config.superAdminUsername || "fr4nce"
            : config.adminUsername || "admin",
        userDisplayName:
          targetRole === "superadmin"
            ? "Gestor SuperAdmin"
            : config.professionalName || "Admin",
        attestationType: "none",
        excludeCredentials: storedPasskeys.map((pk) => ({
          id: pk.id,
          transports: pk.transports,
        })),
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });

      const clientIp = getClientIp(req);
      webauthnChallengesMap.set(`reg:${clientIp}`, {
        challenge: options.challenge,
        expiresAt: Date.now() + CHALLENGE_TTL_MS,
        role: targetRole,
      });

      return NextResponse.json({ options });
    }

    if (action === "passkey_register_verify") {
      const clientIp = getClientIp(req);
      const challengeEntry = webauthnChallengesMap.get(`reg:${clientIp}`);
      if (!challengeEntry || challengeEntry.expiresAt < Date.now()) {
        return NextResponse.json(
          { error: "Desafio expirado. Tente registrar novamente." },
          { status: 400 }
        );
      }

      const config = await getStudioConfigRow();
      if (!config) {
        return NextResponse.json(
          { error: "Configuração não encontrada." },
          { status: 404 }
        );
      }

      const { rpID, origin } = getRpIdAndOrigin(req);
      const verification = await verifyRegistrationResponse({
        response: body.credential,
        expectedChallenge: challengeEntry.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json(
          { error: "Não foi possível validar a Passkey." },
          { status: 400 }
        );
      }

      const targetRole = challengeEntry.role || authRole;
      webauthnChallengesMap.delete(`reg:${clientIp}`);

      const {
        credential,
        credentialDeviceType,
        credentialBackedUp,
      } = verification.registrationInfo;

      const storedPasskeys = parsePasskeys(
        targetRole === "superadmin"
          ? config.superAdminPasskeysJson
          : config.passkeysJson
      );
      const deviceLabel =
        String(body.deviceName || "").trim() ||
        `Passkey #${storedPasskeys.length + 1}`;

      const newPasskey: StoredPasskey = {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports,
        name: deviceLabel,
        createdAt: new Date().toISOString(),
      };

      const nextList = [
        ...storedPasskeys.filter((p) => p.id !== newPasskey.id),
        newPasskey,
      ];

      if (targetRole === "superadmin") {
        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "superAdminPasskeysJson" = ? WHERE "id" = 1`,
          JSON.stringify(nextList)
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "passkeysJson" = ? WHERE "id" = 1`,
          JSON.stringify(nextList)
        );
      }

      return NextResponse.json({
        success: true,
        message: "Passkey (FaceID / Biometria) cadastrada com sucesso!",
      });
    }

    if (action === "passkey_delete") {
      const passkeyId = String(body.passkeyId || "");
      const targetRole =
        authRole === "superadmin" && body.targetRole === "admin"
          ? "admin"
          : authRole;
      const config = await getStudioConfigRow();

      if (targetRole === "superadmin") {
        const storedPasskeys = parsePasskeys(config?.superAdminPasskeysJson);
        const nextList = storedPasskeys.filter((pk) => pk.id !== passkeyId);
        const nextRequire2FA =
          nextList.length === 0 ? 0 : config?.superAdminRequire2FA ? 1 : 0;

        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "superAdminPasskeysJson" = ?, "superAdminRequire2FA" = ? WHERE "id" = 1`,
          JSON.stringify(nextList),
          nextRequire2FA
        );
      } else {
        const storedPasskeys = parsePasskeys(config?.passkeysJson);
        const nextList = storedPasskeys.filter((pk) => pk.id !== passkeyId);
        const nextRequire2FA =
          nextList.length === 0 ? 0 : config?.requirePasskey2FA ? 1 : 0;

        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "passkeysJson" = ?, "requirePasskey2FA" = ? WHERE "id" = 1`,
          JSON.stringify(nextList),
          nextRequire2FA
        );
      }

      return NextResponse.json({
        success: true,
        message: "Passkey removida!",
      });
    }

    if (action === "passkey_toggle_2fa") {
      const enabled = Boolean(body.requirePasskey2FA);
      const targetRole =
        authRole === "superadmin" && body.targetRole === "admin"
          ? "admin"
          : authRole;
      const config = await getStudioConfigRow();

      if (targetRole === "superadmin") {
        const storedPasskeys = parsePasskeys(config?.superAdminPasskeysJson);
        if (enabled && storedPasskeys.length === 0) {
          return NextResponse.json(
            { error: "Cadastre ao menos 1 Passkey antes de exigir 2FA." },
            { status: 400 }
          );
        }
        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "superAdminRequire2FA" = ? WHERE "id" = 1`,
          enabled ? 1 : 0
        );
      } else {
        const storedPasskeys = parsePasskeys(config?.passkeysJson);
        if (enabled && storedPasskeys.length === 0) {
          return NextResponse.json(
            { error: "Cadastre ao menos 1 Passkey antes de exigir 2FA." },
            { status: 400 }
          );
        }
        await prisma.$executeRawUnsafe(
          `UPDATE "StudioConfig" SET "requirePasskey2FA" = ? WHERE "id" = 1`,
          enabled ? 1 : 0
        );
      }

      return NextResponse.json({
        success: true,
        message: enabled
          ? "2FA obrigatório com Passkey ativado!"
          : "Login rápido com Passkey mantido (2FA obrigatório desativado).",
      });
    }

    if (action === "test_recovery_email") {
      const current = await getStudioConfigRow();
      if (!current) {
        return NextResponse.json(
          { error: "Configuração não encontrada." },
          { status: 404 }
        );
      }

      const smtpHost = String(
        body.smtpHost ?? current.smtpHost ?? "smtp.gmail.com"
      ).trim();
      const smtpPort = Number(body.smtpPort ?? current.smtpPort ?? 465);
      const rawSmtpUser = String(
        body.smtpUser ?? current.smtpUser ?? ""
      ).trim();
      const smtpUser = rawSmtpUser.includes("@")
        ? rawSmtpUser
        : current.superAdminEmail || "guilhermefrance9@gmail.com";
      const smtpPass = String(body.smtpPass ?? current.smtpPass ?? "").trim();

      const targetEmail = String(
        body.testDestinationEmail ||
          body.superAdminEmail ||
          body.adminEmail ||
          smtpUser
      ).trim();

      if (!targetEmail) {
        return NextResponse.json(
          { error: "Informe um e-mail de destino para o teste." },
          { status: 400 }
        );
      }

      await prisma.$executeRawUnsafe(
        `UPDATE "StudioConfig" SET "smtpHost" = ?, "smtpPort" = ?, "smtpUser" = ?, "smtpPass" = ? WHERE "id" = 1`,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass
      );

      const studioTitle = current.studioName || "Isabele Lash Designer";
      try {
        await sendRecoveryEmail({
          to: targetEmail,
          studioName: studioTitle,
          subject: `Teste de Provedor SMTP - ${studioTitle}`,
          text: `Tudo certo! O provedor SMTP do sistema (${studioTitle}) está configurado e enviando e-mails perfeitamente.`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 28px 24px; background-color: #FAF8F5; border-radius: 24px; border: 1px solid #E5E0D8; color: #111111;">
              <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #10B981;">PROVEDOR SMTP ATIVO</span>
              <h2 style="margin: 6px 0 12px; font-size: 20px; font-weight: 800; color: #111111;">${studioTitle}</h2>
              <p style="font-size: 13px; color: #57534E; line-height: 1.5; margin: 0;">
                O provedor SMTP (<strong>${smtpUser}</strong>) enviou este e-mail de teste com sucesso para <strong>${targetEmail}</strong>.
              </p>
            </div>
          `,
          config: { smtpHost, smtpPort, smtpUser, smtpPass },
        });
      } catch (err: unknown) {
        return NextResponse.json(
          {
            error:
              (err as { message?: string })?.message ||
              "Erro ao conectar ao servidor SMTP. Verifique o usuário e a Senha de App.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `E-mail de teste enviado para ${targetEmail}!`,
      });
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
        adminEmail,
        superAdminUsername,
        superAdminPassword,
        superAdminEmail,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
      } = body;

      const current = await getStudioConfigRow();
      const newUsername =
        adminUsername?.trim() || current?.adminUsername || "isabele";
      const newPassword =
        adminPassword || current?.adminPassword || "Deus2006.";
      const newSuperUser =
        superAdminUsername?.trim() || current?.superAdminUsername || "fr4nce";
      const newSuperPass =
        superAdminPassword || current?.superAdminPassword || "yeshua77377";

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

      const nextAdminEmail =
        adminEmail !== undefined
          ? String(adminEmail).trim()
          : current?.adminEmail || "";
      const nextSuperEmail =
        superAdminEmail !== undefined
          ? String(superAdminEmail).trim()
          : current?.superAdminEmail || "guilhermefrance9@gmail.com";
      const nextSmtpHost =
        smtpHost !== undefined
          ? String(smtpHost).trim() || "smtp.gmail.com"
          : current?.smtpHost || "smtp.gmail.com";
      const nextSmtpPort =
        smtpPort !== undefined
          ? Number(smtpPort) || 465
          : current?.smtpPort || 465;
      const rawSmtpUser =
        smtpUser !== undefined
          ? String(smtpUser).trim()
          : current?.smtpUser || "";
      const nextSmtpUser = rawSmtpUser.includes("@")
        ? rawSmtpUser
        : current?.smtpUser || nextSuperEmail;
      const nextSmtpPass =
        smtpPass !== undefined
          ? String(smtpPass).trim()
          : current?.smtpPass || "";

      await prisma.$executeRawUnsafe(
        `UPDATE "StudioConfig" SET "adminEmail" = ?, "superAdminUsername" = ?, "superAdminPassword" = ?, "superAdminEmail" = ?, "smtpHost" = ?, "smtpPort" = ?, "smtpUser" = ?, "smtpPass" = ? WHERE "id" = 1`,
        nextAdminEmail,
        newSuperUser,
        newSuperPass,
        nextSuperEmail,
        nextSmtpHost,
        nextSmtpPort,
        nextSmtpUser,
        nextSmtpPass
      );

      const token =
        authRole === "superadmin"
          ? buildSessionToken("superadmin", newSuperUser, newSuperPass)
          : buildSessionToken("admin", newUsername, newPassword);

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
  } catch (error: unknown) {
    console.error("Error in POST /api/admin:", error);
    const detail = (error as { message?: string })?.message || "";
    return NextResponse.json(
      {
        error: detail
          ? `Erro ao processar solicitação administrativa: ${detail}`
          : "Erro ao processar solicitação administrativa",
      },
      { status: 500 }
    );
  }
}
