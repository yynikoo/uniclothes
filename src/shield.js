// UNICLOTHES shield: our own bot / flood protection, no third-party service.
//
// 1. Rate limit (always on): each IP gets a request budget per minute. It's kept in memory, so on
//    Vercel each running instance counts separately: it slows floods down, it doesn't stop big ones.
//    Network-level DDoS is handled by Vercel's platform before requests reach this code.
// 2. Proof-of-work check (on when SHIELD_SECRET is set): a visitor without a pass gets a page whose
//    JavaScript must find a number that makes sha256(challenge:number) start with N zero bits.
//    That costs a browser about a second, but makes mass requests expensive for bots. The answer is
//    checked with one hash on the server, then the visitor gets a signed HttpOnly pass cookie.
//
// Env vars:
//   SHIELD_SECRET      long random string; signs challenges and pass cookies (required to turn the check on)
//   SHIELD_DIFFICULTY  optional, zero bits required (default 18; each +1 doubles the work)
import crypto from "node:crypto";

const COOKIE_NAME = "uc_pass";
const PASS_MAX_AGE = 60 * 60 * 24; // pass lasts 1 day
const CHALLENGE_TTL = 120; // seconds to solve a challenge
const DEFAULT_DIFFICULTY = 18;

const RATE_WINDOW_MS = 60_000;
const RATE_LIMITS = { page: 300, verify: 20 }; // requests per IP per minute (generous: campuses share IPs)
const MAX_TRACKED_IPS = 20_000;

// Paths that skip the check (assets, health checks, and the verify endpoint itself).
const OPEN_PATHS = new Set(["/health", "/shield/verify", "/favicon-light.svg", "/favicon-dark.svg", "/favicon.ico"]);

export function shieldConfig() {
  const secret = process.env.SHIELD_SECRET;
  if (!secret) return null;
  const parsed = Number.parseInt(process.env.SHIELD_DIFFICULTY ?? "", 10);
  const difficulty = Number.isInteger(parsed) && parsed >= 8 && parsed <= 26 ? parsed : DEFAULT_DIFFICULTY;
  return { secret, difficulty };
}

export function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

const hmac = (secret, value) => crypto.createHmac("sha256", secret).update(value).digest("base64url");
const nowSeconds = () => Math.floor(Date.now() / 1000);

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function zeroBits(hex) {
  return Math.clz32(Number.parseInt(hex.slice(0, 8), 16));
}

// ---------- Rate limit ----------
const buckets = new Map(); // `${kind}:${ip}` -> { count, resetAt }

function overLimit(kind, ip) {
  const now = Date.now();
  const key = `${kind}:${ip}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_IPS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_TRACKED_IPS) buckets.clear();
    }
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMITS[kind] ? Math.ceil((bucket.resetAt - now) / 1000) : 0;
}

export function rateLimit(kind) {
  return (req, res, next) => {
    const retryAfter = overLimit(kind, clientIp(req));
    if (!retryAfter) return next();
    res.status(429).set({ "Retry-After": String(retryAfter), "Cache-Control": "no-store" })
      .type("text").send("Too many requests. Please wait a minute and try again.");
  };
}

// ---------- Challenge + pass ----------
// A challenge is "expires.random"; its signature ties it to the visitor's IP and difficulty.
function newChallenge(config, ip) {
  const challenge = `${nowSeconds() + CHALLENGE_TTL}.${crypto.randomBytes(12).toString("hex")}`;
  const signature = hmac(config.secret, `challenge:${challenge}:${config.difficulty}:${ip}`);
  return { challenge, signature, difficulty: config.difficulty };
}

function passCookieValue(config, ip) {
  const expires = String(nowSeconds() + PASS_MAX_AGE);
  return `${expires}.${hmac(config.secret, `pass:${expires}:${ip}`)}`;
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

function hasValidPass(req, config, ip) {
  const [expires, sig] = (readCookie(req, COOKIE_NAME) || "").split(".");
  if (!expires || !sig || !(Number(expires) > nowSeconds())) return false;
  return safeEqual(sig, hmac(config.secret, `pass:${expires}:${ip}`));
}

// Middleware: page requests without a valid pass get the check page instead of the site.
export function shieldGate(renderCheckPage) {
  return (req, res, next) => {
    const config = shieldConfig();
    if (!config) return next();
    if ((req.method !== "GET" && req.method !== "HEAD") || OPEN_PATHS.has(req.path)) return next();
    const ip = clientIp(req);
    if (hasValidPass(req, config, ip)) return next();
    res.status(403)
      .set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex" })
      .type("html")
      .send(renderCheckPage(newChallenge(config, ip)));
  };
}

// POST /shield/verify { challenge, signature, nonce }
export function verifyHandler(req, res) {
  const config = shieldConfig();
  if (!config) return res.status(404).json({ ok: false });

  const { challenge, signature, nonce } = req.body || {};
  const valid =
    typeof challenge === "string" && challenge.length <= 64 &&
    typeof signature === "string" && signature.length <= 64 &&
    (typeof nonce === "string" || typeof nonce === "number") && String(nonce).length <= 16;
  if (!valid) return res.status(400).json({ ok: false });

  const ip = clientIp(req);
  const expected = hmac(config.secret, `challenge:${challenge}:${config.difficulty}:${ip}`);
  if (!safeEqual(signature, expected)) return res.status(403).json({ ok: false, reason: "bad-challenge" });
  if (!(Number(challenge.split(".")[0]) > nowSeconds())) return res.status(403).json({ ok: false, reason: "expired" });

  const digest = crypto.createHash("sha256").update(`${challenge}:${nonce}`).digest("hex");
  if (zeroBits(digest) < config.difficulty) return res.status(403).json({ ok: false, reason: "wrong-answer" });

  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const cookie = [
    `${COOKIE_NAME}=${passCookieValue(config, ip)}`, "Path=/", `Max-Age=${PASS_MAX_AGE}`,
    "HttpOnly", "SameSite=Lax", ...(secure ? ["Secure"] : []),
  ].join("; ");
  res.set({ "Set-Cookie": cookie, "Cache-Control": "no-store" }).json({ ok: true });
}
