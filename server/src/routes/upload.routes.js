import { Router } from 'express';
import { requireAuth } from '../auth.js';

export const uploadRouter = Router();
uploadRouter.use(requireAuth);

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

/**
 * Valida una imagen (data URL) y la devuelve para guardarla junto al gasto en la
 * base de datos. No usa disco, así funciona en hosting sin almacenamiento
 * persistente (la foto vive en la BD, que sí es persistente).
 *
 * El frontend comprime la imagen antes de enviarla para que no sea muy grande.
 */
uploadRouter.post('/', (req, res) => {
  const { dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string') {
    return res.status(400).json({ error: 'Falta la imagen' });
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Formato de imagen inválido' });
  if (!ALLOWED.includes(match[1])) return res.status(400).json({ error: 'Tipo de imagen no permitido' });

  // Tamaño aproximado de los bytes decodificados.
  const sizeBytes = Math.ceil((match[2].length * 3) / 4);
  if (sizeBytes > 1.5 * 1024 * 1024) {
    return res.status(413).json({ error: 'Imagen demasiado grande (máx 1.5MB tras comprimir)' });
  }

  res.status(201).json({ url: dataUrl });
});
