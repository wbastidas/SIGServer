/**
 * Backend ligero de autenticacion y token broker de ArcGIS (seccion 3.1, RF-AUTH,
 * RNF-SEC-01/03). Referencia minima, SIN dependencias externas de npm: usa solo
 * modulos nativos de Node.js (http, crypto). Pensado para publicarse detras de IIS
 * (ARR + URL Rewrite) o como proceso independiente.
 *
 *   - POST /login          -> valida usuario/clave (hash) y emite un JWT propio (HS256).
 *   - GET  /arcgis-token   -> (token broker) obtiene un token del ArcGIS Server con
 *                             credenciales del servidor y lo devuelve al cliente
 *                             autenticado. Las credenciales NUNCA llegan al navegador.
 *
 * IMPORTANTE: esto es una base para la Fase 1 (piloto). En produccion sustituya el
 * store de usuarios por BD/LDAP/AD (RF-AUTH-04) y sirva SOLO por HTTPS (RNF-SEC-02).
 */
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = process.env.AUTH_PORT ? Number(process.env.AUTH_PORT) : 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'cambie-este-secreto';
const JWT_EXP_MIN = process.env.JWT_EXPIRES_MINUTES ? Number(process.env.JWT_EXPIRES_MINUTES) : 60;

// --- Store de usuarios (DEMO). Contrasenas hasheadas con scrypt (RNF-SEC-01). ---
// Sustituir por BD/LDAP en produccion. Genere hashes con hashPassword() abajo.
const USERS = [
  {
    username: 'admin',
    // hash de "admin" (salt:hash en hex). Solo demo.
    passwordHash: seedHash('admin'),
    roles: ['admin'],
    displayName: 'Administrador',
  },
];

function seedHash(plain) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(plain, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

function verifyPassword(plain, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const derived = crypto.scryptSync(plain, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hashHex, 'hex'), derived);
}

// --- JWT HS256 minimo (sin dependencias) ---
function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signJwt(payload, expMinutes) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expMinutes * 60;
  const body = { ...payload, exp };
  const encHeader = base64url(JSON.stringify(header));
  const encBody = base64url(JSON.stringify(body));
  const data = `${encHeader}.${encBody}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return { token: `${data}.${sig}`, expiresAt: exp * 1000 };
}

function verifyJwt(token) {
  try {
    const [h, b, s] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(b, 'base64url').toString());
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Token broker de ArcGIS Server (RF-AUTH-05, RNF-SEC-03) ---
async function getArcgisToken() {
  const tokenUrl = process.env.ARCGIS_TOKEN_URL;
  const username = process.env.ARCGIS_USERNAME;
  const password = process.env.ARCGIS_PASSWORD;
  if (!tokenUrl || !username || !password) return null;

  const params = new URLSearchParams({
    username,
    password,
    client: 'referer',
    referer: process.env.ARCGIS_REFERER || 'https://localhost',
    expiration: '60',
    f: 'json',
  });
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!data.token) return null;
  // La URL base del servidor para registrar el token en el cliente.
  const server = (process.env.ARCGIS_SERVER_BASE || tokenUrl).replace(/\/tokens.*$/, '/rest');
  return { token: data.token, expires: data.expires, server };
}

// --- Utilidades HTTP ---
function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function requireAuth(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return verifyJwt(token);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') return json(res, 204, {});

  // POST /login
  if (req.method === 'POST' && url.pathname === '/login') {
    const { username, password } = await readBody(req);
    const user = USERS.find((u) => u.username === username);
    if (!user || !verifyPassword(password || '', user.passwordHash)) {
      return json(res, 401, { error: 'Credenciales invalidas' });
    }
    const { token, expiresAt } = signJwt(
      { sub: user.username, roles: user.roles },
      JWT_EXP_MIN,
    );
    return json(res, 200, {
      token,
      expiresAt,
      user: { username: user.username, roles: user.roles, displayName: user.displayName },
    });
  }

  // GET /arcgis-token (protegido)
  if (req.method === 'GET' && url.pathname === '/arcgis-token') {
    if (!requireAuth(req)) return json(res, 401, { error: 'No autorizado' });
    const info = await getArcgisToken();
    if (!info) return json(res, 503, { error: 'Token de ArcGIS no disponible' });
    return json(res, 200, info);
  }

  // GET /health
  if (url.pathname === '/health') return json(res, 200, { ok: true });

  return json(res, 404, { error: 'No encontrado' });
});

server.listen(PORT, () => {
  console.log(`[auth] Servidor de autenticacion/proxy escuchando en http://localhost:${PORT}`);
});
