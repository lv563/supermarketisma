import { api, assetUrl } from './api';

/** Sube una foto (como data URL) al backend y devuelve la URL pública servible. */
export async function uploadPhoto(_uid: string, file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const { url } = await api<{ url: string }>('/upload', {
    method: 'POST',
    body: { dataUrl },
  });
  return assetUrl(url) ?? url;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
