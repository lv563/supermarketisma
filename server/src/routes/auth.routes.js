import { Router } from 'express';
import { db, uid } from '../db.js';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../auth.js';
import { sendEmail, welcomeEmail } from '../email.js';

export const authRouter = Router();

function publicUser(row) {
  return { uid: row.id, email: row.email, displayName: row.name };
}

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  if (String(password).length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });

  const id = uid();
  db.prepare('INSERT INTO users (id, email, name, password, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    id,
    String(email).toLowerCase(),
    name || '',
    hashPassword(String(password)),
    Date.now(),
  );

  const user = { id, email: String(email).toLowerCase(), name: name || '' };
  const token = signToken({ sub: id });

  // Correo de bienvenida (no bloquea la respuesta).
  const mail = welcomeEmail(user);
  sendEmail({ to: user.email, subject: mail.subject, html: mail.html }).catch(() => {});

  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!row || !verifyPassword(String(password), row.password)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  const token = signToken({ sub: row.id });
  res.json({ token, user: publicUser(row) });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user: publicUser(row) });
});
