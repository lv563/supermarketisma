/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend, p. ej. http://localhost:4000/api */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
