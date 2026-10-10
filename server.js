const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
const CONTENT_FILE = path.join(__dirname, 'data', 'site-content.json');
const COOKIE_NAME = 'newheroes_admin';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BUILT_IN_SLUGS = ['inicio', 'historia', 'mapa', 'personagens', 'temporada', 'noticias'];
const BUILT_IN_ROUTES = {
  '/': 'inicio',
  '/historia': 'historia',
  '/mapa': 'mapa',
  '/personagens': 'personagens',
  '/temporada': 'temporada',
  '/noticias': 'noticias'
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '8mb' }));
app.use(express.static(PUBLIC_DIR, { index: false }));
app.use('/admin', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

let content = readContent();
const sessions = new Map();
const failedLogins = new Map();
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || '123';
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(48).toString('hex');

function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}

function safeEqual(left, right) {
  const leftHash = crypto.createHash('sha256').update(String(left)).digest();
  const rightHash = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function signSessionId(id) {
  return crypto.createHmac('sha256', sessionSecret).update(id).digest('hex');
}

function getCookie(req, name) {
  const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!cookie) return '';
  try { return decodeURIComponent(cookie.slice(name.length + 1)); } catch { return ''; }
}

function adminSession(req, res, next) {
  const [id, signature] = getCookie(req, COOKIE_NAME).split('.');
  const stored = id && sessions.get(id);
  if (!stored || !signature || !safeEqual(signature, signSessionId(id)) || stored.expiresAt <= Date.now()) {
    if (id) sessions.delete(id);
    return res.status(401).json({ error: 'Sessão encerrada. Entre novamente.' });
  }
  req.adminSession = stored;
  next();
}

function checkCsrf(req, res, next) {
  if (!safeEqual(req.get('x-csrf-token') || '', req.adminSession.csrfToken)) {
    return res.status(403).json({ error: 'Verificação de segurança inválida. Atualize o painel e tente novamente.' });
  }
  next();
}

function cleanText(value, maxLength = 3000) {
  return typeof value === 'string' ? value.replace(/\0/g, '').slice(0, maxLength) : '';
}

function cleanImagePath(value) {
  const imagePath = cleanText(value, 220);
  if (!imagePath) return '';
  if (!/^\/(assets|uploads)\/[A-Za-z0-9._/-]+$/.test(imagePath) || imagePath.split('/').includes('..')) {
    throw new Error('Use uma imagem da biblioteca do site ou envie um arquivo de imagem.');
  }
  return imagePath;
}

function cleanHref(value) {
  const href = cleanText(value, 220);
  if (!href) return '';
  if (!/^\/(?!\/)[A-Za-z0-9_/?#=&%.-]*$/.test(href)) throw new Error('Os links dos blocos devem apontar para uma página deste site.');
  return href;
}

function normalizeContent(input) {
  if (!input || !input.site || !Array.isArray(input.pages) || input.pages.length > 50) {
    throw new Error('O conteúdo enviado está incompleto ou contém páginas demais.');
  }

  const site = {
    name: cleanText(input.site.name, 100).trim() || 'New Heroes',
    logo: cleanImagePath(input.site.logo),
    footerText: cleanText(input.site.footerText, 240),
    accentColor: /^#[0-9a-f]{6}$/i.test(input.site.accentColor || '') ? input.site.accentColor : '#35c5e8',
    backgroundColor: /^#[0-9a-f]{6}$/i.test(input.site.backgroundColor || '') ? input.site.backgroundColor : '#071522'
  };
  const seen = new Set();
  const pages = input.pages.map((page) => {
    const slug = cleanText(page.slug, 50).toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug === 'admin' || seen.has(slug)) {
      throw new Error('Cada página precisa de um endereço único, usando apenas letras sem acento, números e hífens.');
    }
    seen.add(slug);
    if (!Array.isArray(page.sections) || page.sections.length > 30) throw new Error('Cada página pode conter até 30 seções.');

    return {
      slug,
      title: cleanText(page.title, 120).trim() || 'Página sem título',
      kicker: cleanText(page.kicker, 100),
      description: cleanText(page.description, 1500),
      heroImage: cleanImagePath(page.heroImage),
      heroAlt: cleanText(page.heroAlt, 240),
      showInNav: Boolean(page.showInNav),
      sections: page.sections.map((section) => {
        if (!Array.isArray(section.items) || section.items.length > 30) throw new Error('Cada seção pode conter até 30 cards.');
        return {
          heading: cleanText(section.heading, 120),
          body: cleanText(section.body, 5000),
          image: cleanImagePath(section.image),
          imageAlt: cleanText(section.imageAlt, 240),
          expandable: Boolean(section.expandable),
          items: section.items.map((item) => ({
            meta: cleanText(item.meta, 100),
            title: cleanText(item.title, 120),
            text: cleanText(item.text, 1500),
            image: cleanImagePath(item.image),
            imageAlt: cleanText(item.imageAlt, 240),
            href: cleanHref(item.href)
          }))
        };
      })
    };
  });

  for (const requiredSlug of BUILT_IN_SLUGS) {
    if (!seen.has(requiredSlug)) throw new Error(`A página padrão “${requiredSlug}” não pode ser removida.`);
  }
  return { site, pages };
}

async function saveContent(nextContent) {
  const normalized = normalizeContent(nextContent);
  const temporaryFile = `${CONTENT_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.promises.writeFile(temporaryFile, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  await fs.promises.rename(temporaryFile, CONTENT_FILE);
  content = normalized;
}

function renderPage(req, res, page) {
  if (!page) return res.status(404).render('404', { pageTitle: 'Página não encontrada', page: null, site: content.site, pages: content.pages });
  res.setHeader('Cache-Control', 'no-store');
  return res.render('cms-page', {
    page,
    site: content.site,
    pages: content.pages,
    pageTitle: `${page.title} — ${content.site.name}`
  });
}

app.get('/admin', (req, res) => {
  const [id, signature] = getCookie(req, COOKIE_NAME).split('.');
  const stored = id && sessions.get(id);
  const authenticated = stored && stored.expiresAt > Date.now() && signature && safeEqual(signature, signSessionId(id));
  res.setHeader('Cache-Control', 'no-store');
  return res.render(authenticated ? 'admin' : 'admin-login');
});

app.post('/admin/api/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const attempts = failedLogins.get(ip);
  if (attempts && attempts.count >= 5 && attempts.resetAt > Date.now()) {
    res.setHeader('Retry-After', String(Math.ceil((attempts.resetAt - Date.now()) / 1000)));
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' });
  }

  const usernameMatches = safeEqual(req.body?.username || '', adminUsername);
  const passwordMatches = safeEqual(req.body?.password || '', adminPassword);
  if (!usernameMatches || !passwordMatches) {
    const active = attempts && attempts.resetAt > Date.now() ? attempts : { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
    active.count += 1;
    failedLogins.set(ip, active);
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  failedLogins.delete(ip);
  const id = crypto.randomBytes(32).toString('hex');
  const session = { csrfToken: crypto.randomBytes(32).toString('hex'), expiresAt: Date.now() + SESSION_TTL_MS };
  sessions.set(id, session);
  const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(`${id}.${signSessionId(id)}`)}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}${secureCookie}`);
  return res.json({ ok: true });
});

app.post('/admin/api/logout', adminSession, checkCsrf, (req, res) => {
  const [id] = getCookie(req, COOKIE_NAME).split('.');
  if (id) sessions.delete(id);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return res.json({ ok: true });
});

app.get('/admin/api/content', adminSession, (req, res) => res.json({ content, csrfToken: req.adminSession.csrfToken }));

app.put('/admin/api/content', adminSession, checkCsrf, async (req, res) => {
  try {
    await saveContent(req.body);
    return res.json({ ok: true, content });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Não foi possível salvar as alterações.' });
  }
});

app.post('/admin/api/upload', adminSession, checkCsrf, async (req, res) => {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(req.body?.dataUrl || '');
  if (!match) return res.status(400).json({ error: 'Envie uma imagem JPG, PNG ou WebP.' });

  const buffer = Buffer.from(match[2], 'base64');
  const kind = match[1];
  const isJpeg = kind === 'jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = kind === 'png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = kind === 'webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES || !(isJpeg || isPng || isWebp)) {
    return res.status(400).json({ error: 'Arquivo inválido. Use um JPG, PNG ou WebP com até 5 MB.' });
  }

  const extension = kind === 'jpeg' ? 'jpg' : kind;
  const filename = `${crypto.randomUUID()}.${extension}`;
  try {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer, { flag: 'wx' });
    return res.json({ path: `/uploads/${filename}` });
  } catch {
    return res.status(500).json({ error: 'Não foi possível armazenar a imagem.' });
  }
});

for (const [route, slug] of Object.entries(BUILT_IN_ROUTES)) {
  app.get(route, (req, res) => renderPage(req, res, content.pages.find((page) => page.slug === slug)));
}

app.get('/:slug', (req, res) => renderPage(req, res, content.pages.find((page) => page.slug === req.params.slug)));
app.use((req, res) => res.status(404).render('404', { pageTitle: 'Página não encontrada', page: null, site: content.site, pages: content.pages }));

if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || adminPassword === '123' || !process.env.SESSION_SECRET)) {
  throw new Error('Para produção, configure ADMIN_USERNAME, uma ADMIN_PASSWORD forte (diferente de 123) e SESSION_SECRET.');
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  if (adminPassword === '123') console.warn('Painel admin usando senha inicial 123. Troque ADMIN_PASSWORD antes de publicar.');
});
