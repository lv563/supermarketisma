import { api } from './api';

/**
 * Comprime la foto en el navegador y la sube. La imagen se guarda junto al gasto
 * en la base de datos (como data URL), por eso la reducimos para que sea ligera.
 */
export async function uploadPhoto(_uid: string, file: File): Promise<string> {
  const dataUrl = await compressImage(file);
  const { url } = await api<{ url: string }>('/upload', {
    method: 'POST',
    body: { dataUrl },
  });
  return url;
}

/** Redimensiona a máx 1000px y exporta como JPEG ~0.7 para reducir el peso. */
function compressImage(file: File, maxSize = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
