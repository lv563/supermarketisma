import { Router } from 'express';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { requireAuth } from '../auth.js';
import { uid, DATA_DIR } from '../db.js';

const UPLOAD_DIR = join(DATA_DIR, 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

export const uploadRouter = Router();
uploadRouter.use(requireAuth);

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

// POST /api/upload  { dataUrl: "data:image/png;base64,..." } -> { url }
uploadRouter.post('/', (req, res) => {
  const { dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string') {
    return res.status(400).json({ error: 'Falta la imagen' });
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Formato de imagen inválido' });

  const mime = match[1];
  const ext = EXT[mime];
  if (!ext) return res.status(400).json({ error: 'Tipo de imagen no permitido' });

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) return res.status(413).json({ error: 'Imagen demasiado grande (máx 5MB)' });

  const filename = `${req.userId}_${uid()}.${ext}`;
  writeFileSync(join(UPLOAD_DIR, filename), buffer);

  res.status(201).json({ url: `/uploads/${filename}` });
});
