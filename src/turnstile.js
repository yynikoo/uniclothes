// Cloudflare Turnstile "are you human" check, shown before the site on a visitor's first request.
//
// Turned on only when both env vars are set (so the site keeps working without them):
//   TURNSTILE_SITE_KEY    public key, rendered into the check page
//   TURNSTILE_SECRET_KEY  secret key, used server-side to verify tokens and sign the pass cookie
// After a successful check the visitor gets a signed, HttpOnly cookie valid for PASS_MAX_AGE seconds.
import crypto from "node:crypto";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const COOKIE_NAME = "uc_verified";
const PASS_MAX_AGE = 60 * 60 * 24; // 1 day

// Paths that never show the check (assets, health checks, and the verify endpoint itself).
const OPEN_PATHS = new Set(["/health", "/verify", "/favicon-light.svg", "/favicon-dark.svg", "/favicon.ico"]);

export function turnstileConfig() {
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  return siteKey && secret ? { siteKey, secret } : null;
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(`uc-pass:${value}`).digest("base64url");
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

function hasValidPass(req, secret) {
  const value = readCookie(req, COOKIE_NAME);
  if (!value) return false;
  const [expires, sig] = value.split(".");
  if (!expires || !sig || !(Number(expires) > Date.now() / 1000)) return false;
  const given = Buffer.from(sig);
  const expected = Buffer.from(sign(expires, secret));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function isHttps(req) {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

// Middleware: page requests without a valid pass get the check page instead of the site.
export function turnstileGate(renderCheckPage) {
  return (req, res, next) => {
    const config = turnstileConfig();
    if (!config) return next();
    if ((req.method !== "GET" && req.method !== "HEAD") || OPEN_PATHS.has(req.path)) return next();
    if (hasValidPass(req, config.secret)) return next();
    res
      .status(403)
      .set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex" })
      .type("html")
      .send(renderCheckPage(config.siteKey));
  };
}

// POST /verify { token }: checks the Turnstile token with Cloudflare and sets the pass cookie.
export async function verifyHandler(req, res) {
  const config = turnstileConfig();
  if (!config) return res.status(404).json({ ok: false });

  const token = req.body?.token;
  if (typeof token !== "string" || !token || token.length > 2048) {
    return res.status(400).json({ ok: false });
  }

  const form = new URLSearchParams({ secret: config.secret, response: token });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  if (ip) form.set("remoteip", ip);

  let result;
  try {
    const response = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    result = await response.json();
  } catch {
    return res.status(502).json({ ok: false });
  }
  if (!result?.success) return res.status(403).json({ ok: false });

  const expires = String(Math.floor(Date.now() / 1000) + PASS_MAX_AGE);
  const cookie = [
    `${COOKIE_NAME}=${expires}.${sign(expires, config.secret)}`,
    "Path=/",
    `Max-Age=${PASS_MAX_AGE}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(isHttps(req) ? ["Secure"] : []),
  ].join("; ");
  res.set("Set-Cookie", cookie).set("Cache-Control", "no-store").json({ ok: true });
}
