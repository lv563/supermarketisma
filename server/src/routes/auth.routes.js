import { Router } from 'express';
import { db, uid } from '../db.js';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../auth.js';
import { sendEmail, welcomeEmail } from '../email.js';

export const authRouter = Router();

function publicUser(row) {
  return { uid: row.id, email: row.email, displayName: row.name };
}

// POST /api/auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    if (String(password).length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const mail = String(email).toLowerCase();
    const exists = await db.get('SELECT id FROM users WHERE email = $1', [mail]);
    if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });

    const id = uid();
    await db.run(
      'INSERT INTO users (id, email, name, password, createdAt) VALUES ($1, $2, $3, $4, $5)',
      [id, mail, name || '', hashPassword(String(password)), Date.now()],
    );

    const user = { id, email: mail, name: name || '' };
    const token = signToken({ sub: id });

    const w = welcomeEmail(user);
    sendEmail({ to: user.email, subject: w.subject, html: w.html }).catch(() => {});

    res.status(201).json({ token, user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });

    const row = await db.get('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()]);
    if (!row || !verifyPassword(String(password), row.password)) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const token = signToken({ sub: row.id });
    res.json({ token, user: publicUser(row) });
  } catch (e) {
    next(e);
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const row = await db.get('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: publicUser(row) });
  } catch (e) {
    next(e);
  }
});
