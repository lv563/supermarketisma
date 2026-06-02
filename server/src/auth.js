import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'cambia-esto-en-produccion-gastospro';
const TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 días

// ---------- Hash de contraseñas (scrypt nativo) ----------
export function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(plain, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const testBuf = scryptSync(plain, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

// ---------- JWT minimalista (HS256) sin dependencias ----------
function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

export function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC };
  const headerB64 = b64url(JSON.stringify(header));
  const bodyB64 = b64url(JSON.stringify(body));
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${bodyB64}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${headerB64}.${bodyB64}.${signature}`;
}

export function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, signature] = parts;
  const expected = createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${bodyB64}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(b64urlDecode(bodyB64));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- Middleware Express ----------
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Sesión inválida o expirada' });

  req.userId = payload.sub;
  next();
}
