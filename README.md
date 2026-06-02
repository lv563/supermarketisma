# GastosPro 💸

Control de gastos y facturas para negocios pequeños, con **backend y base de datos reales**.

> **Regla #1:** _Registrar algo debe tomar menos tiempo que ignorarlo._

App **tipo escritorio** (sidebar + dashboard), responsive. Todo se **guarda de verdad**:
cuentas de usuario, historial de gastos (con su día y hora) y facturas — persisten en
una base de datos SQLite en el servidor y sobreviven a reinicios.

---

## 🚀 Cómo correrla

Requiere **Node.js 22 o superior** (usa el SQLite integrado de Node).

```bash
# 1) Instalar dependencias del frontend y del backend
npm run setup

# 2) Arrancar backend + frontend a la vez
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend (API): http://localhost:4000

Crea una cuenta en la pantalla de registro → todo lo que registres queda guardado en
tu cuenta. Cierra sesión, vuelve a entrar, reinicia el servidor: **tus datos siguen ahí**.

### ¿Prefieres arrancarlos por separado?

```bash
npm run server:dev   # API en :4000 (con --watch)
npm run dev          # Frontend en :5173
```

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run setup` | Instala dependencias de frontend y backend |
| `npm run dev:all` | Backend + frontend juntos (concurrently) |
| `npm run dev` | Solo frontend |
| `npm run server:dev` | Solo backend (recarga en caliente) |
| `npm run build` | Typecheck + build de producción del frontend (`dist/`) |
| `npm run preview` | Sirve el build |

---

## 🧱 Arquitectura

```
┌─────────────────────────────┐         HTTP / JSON          ┌──────────────────────────┐
│  Frontend (React + Vite)    │  ───────────────────────▶   │  Backend (Express)        │
│                             │   Authorization: Bearer JWT  │                          │
│  pages → hooks → services   │                              │  routes → auth → SQLite  │
│  services/api.ts (fetch)    │  ◀───────────────────────   │  node:sqlite (en disco)  │
└─────────────────────────────┘                              └──────────────────────────┘
```

- **El frontend nunca habla con la base de datos directamente.** Pasa por servicios
  (`auth`, `expenses`, `invoices`, `storage`) que llaman a la API REST vía `services/api.ts`.
- **Autenticación con JWT.** Al iniciar sesión el backend devuelve un token firmado
  (HS256) que el cliente guarda y envía en cada petición. Las contraseñas se guardan
  **hasheadas con scrypt** (nunca en texto plano).
- **Aislamiento por usuario.** Cada consulta filtra por el `userId` del token: un
  usuario solo ve y modifica sus propios gastos y facturas.

### Estructura de carpetas

```
gastos-pro/
├─ index.html · vite.config.ts · tailwind.config.js · tsconfig.json
├─ .env.example                         # VITE_API_URL
├─ server/                              # ===== BACKEND =====
│  ├─ package.json
│  ├─ data/                             # (se crea solo) BD SQLite + fotos subidas
│  └─ src/
│     ├─ index.js                       # Express: CORS, JSON, estáticos, rutas
│     ├─ db.js                          # node:sqlite + esquema + índices
│     ├─ auth.js                        # scrypt (hash) + JWT (HS256) + middleware
│     └─ routes/
│        ├─ auth.routes.js              # /register /login /me
│        ├─ expenses.routes.js          # CRUD de gastos (fecha/hora automáticas)
│        ├─ invoices.routes.js          # CRUD de facturas + cambio de estado
│        └─ upload.routes.js            # subida de fotos (data URL → archivo)
└─ src/                                 # ===== FRONTEND =====
   ├─ main.tsx · App.tsx · index.css
   ├─ types/index.ts
   ├─ constants/categories.ts           # categorías + emojis + keywords de voz
   ├─ lib/utils.ts                      # formatMoney, fechas, parseVoiceExpense
   ├─ contexts/   AuthContext · ToastContext
   ├─ hooks/      useExpenses · useInvoices · useExpenseFilters · useVoiceInput
   ├─ services/   api · auth · expenses · invoices · storage · ocr
   ├─ components/ ui/ · layout/ · expenses/ · invoices/
   ├─ pages/      Login · Dashboard · QuickExpense · Invoices · Calendar · History · Reports
   └─ routes/     ProtectedRoute
```

---

## 🗄️ Base de datos (SQLite)

Se crea automáticamente en `server/data/gastospro.db` al arrancar. Esquema:

```sql
users (
  id TEXT PK, email TEXT UNIQUE, name TEXT,
  password TEXT,          -- scrypt: "salt:hash"
  createdAt INTEGER
)

expenses (
  id TEXT PK,
  amount REAL,            -- > 0
  category TEXT,          -- combustible|comida|transporte|factura|materiales|otros
  date TEXT,              -- 'yyyy-MM-dd'  (día del registro, automático)
  time TEXT,              -- 'HH:mm'       (automático)
  note TEXT, photoUrl TEXT,
  createdBy TEXT FK→users, createdAt INTEGER
)

invoices (
  id TEXT PK,
  supplier TEXT, invoiceNumber TEXT, amount REAL,
  issueDate TEXT, dueDate TEXT,
  status TEXT,            -- pendiente|pagada|vencida
  createdBy TEXT FK→users, createdAt INTEGER
)
```

Índices: `expenses(createdBy, createdAt DESC)`, `expenses(createdBy, date)`,
`invoices(createdBy, dueDate)`. Borrado en cascada al eliminar un usuario.

**Estado efectivo de facturas:** una factura `pendiente` cuyo `dueDate` ya pasó se
muestra como `vencida` automáticamente en el frontend, sin reescribir la base de datos.

---

## 🔌 API REST

Todas las rutas (excepto register/login) requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Crear cuenta → `{ token, user }` |
| `POST` | `/api/auth/login` | Iniciar sesión → `{ token, user }` |
| `GET`  | `/api/auth/me` | Usuario actual |
| `GET`  | `/api/expenses` | Historial de gastos (desc) |
| `POST` | `/api/expenses` | Crear gasto (fecha/hora/usuario automáticos) |
| `DELETE` | `/api/expenses/:id` | Eliminar gasto |
| `GET`  | `/api/invoices` | Facturas (por vencimiento) |
| `POST` | `/api/invoices` | Crear factura |
| `PATCH` | `/api/invoices/:id` | Actualizar (p. ej. marcar pagada) |
| `DELETE` | `/api/invoices/:id` | Eliminar factura |
| `POST` | `/api/upload` | Subir foto (data URL) → `{ url }` |
| `POST` | `/api/reminders/run` | Disparar recordatorios de facturas ahora (para probar) |
| `GET`  | `/api/health` | Estado del servidor |

### Configuración

Frontend (`.env`, opcional — por defecto apunta a `localhost:4000`):

```bash
VITE_API_URL=http://localhost:4000/api
```

Backend — copia `server/.env.example` a `server/.env` (se carga solo al arrancar):

```bash
PORT=4000
JWT_SECRET=pon-un-secreto-largo-aqui    # ¡cámbialo en producción!
RESEND_API_KEY=                         # vacío = correos a consola (dev)
MAIL_FROM=GastosPro <onboarding@resend.dev>
REMINDER_DAYS_AHEAD=2
DB_PATH=server/data/gastospro.db
```

---

## ✉️ Correos automáticos

El backend envía correos en estos momentos:

| Cuándo | Asunto de ejemplo |
|---|---|
| Al **crear la cuenta** | ¡Bienvenido a GastosPro! 🎉 |
| Factura **por vencer** (hoy/mañana, según `REMINDER_DAYS_AHEAD`) | Recordatorio: Claro vence hoy 🔔 |
| Factura **vencida** | ⚠️ Factura vencida: Edesur |
| Factura marcada **pagada** | Factura pagada: Edesur ✅ |

**Cómo funciona**
- Usa **Resend** vía su API HTTP (sin SDK). Si `RESEND_API_KEY` está vacío, los
  correos se imprimen en la **consola del servidor** — así puedes desarrollar sin claves.
- Los recordatorios (por vencer / vencida) corren **automáticamente**: una revisión
  al arrancar y luego **cada 12 horas**. No se repite el mismo aviso el mismo día
  (columnas `remindedDueSoon` / `remindedOverdue`).
- Para probar al instante sin esperar: `POST /api/reminders/run` con tu token.

**Activar envío real**
1. Crea una cuenta gratis en https://resend.com y genera una **API Key**.
2. Para que los correos lleguen a cualquier destinatario, **verifica un dominio** en
   Resend y pon `MAIL_FROM=GastosPro <algo@tudominio.com>`. (Sin dominio verificado,
   Resend en modo prueba solo entrega a tu propio correo.)
3. Pon ambos valores en `server/.env` y reinicia el backend.

---

## 🖥️ Pantallas

| # | Pantalla | Qué hace |
|---|---|---|
| 1 | **Dashboard** | Total gastado hoy, pendientes, vencidas, próximos vencimientos, registro rápido y alertas. |
| 2 | **Registro rápido** ⭐ | Monto gigante + categorías de un toque. Fecha/hora/usuario automáticos. Voz y foto opcionales. Objetivo: < 5 s. |
| 3 | **Facturas** | Tarjetas con borde de color (🟢 pagada / 🟡 pronto / 🔴 vencida), filtros, marcar pagada, OCR para autocompletar. |
| 4 | **Calendario** | FullCalendar: total a pagar por día; clic en un día muestra el detalle. |
| 5 | **Historial** | Búsqueda + filtros por texto, categoría, rango de fecha y de monto. |
| 6 | **Reportes** | Recharts: gasto por categoría, semanal y mensual, y estado de facturas. |

### Funciones destacadas
- **Modo rápido:** guardas solo monto + categoría; el servidor agrega lo demás.
- **Registro por voz:** di _"450 gasolina"_ → interpreta monto 450 + categoría
  Combustible y guarda solo (Web Speech API + `parseVoiceExpense`).
- **OCR de facturas:** foto → Tesseract.js (carga diferida) intenta extraer proveedor,
  monto y vencimiento, y rellena el formulario.
- **Botón flotante "+ Registrar"** siempre visible.

---

## ☁️ Despliegue

**Frontend** (estático): `npm run build` → sube `dist/` a Vercel, Netlify o cualquier
hosting estático. Define `VITE_API_URL` apuntando a tu backend público.

**Backend** (Node): despliega la carpeta `server/` en un host que soporte Node 22+
(Railway, Render, Fly.io, un VPS…). Define `JWT_SECRET` y un `DB_PATH` en un volumen
persistente. Arranca con `npm run serve`.

> Para producción seria, considera migrar de SQLite a PostgreSQL (el código de datos
> está aislado en `server/src/db.js` y las rutas), y servir las fotos desde un bucket
> (S3/Cloud Storage) en vez del disco local.

---

## 🗺️ Roadmap

### ✅ Hecho
- Backend real (Express + SQLite) con auth JWT y contraseñas hasheadas
- Registro rápido de gastos · Facturas con estados y colores · Subida de fotos
- Dashboard · Historial con filtros · Calendario · Reportes
- Persistencia verificada (sobrevive reinicios) · Aislamiento por usuario
- **Correos automáticos** (Resend): bienvenida, por vencer, vencida y pagada

### Próximo
- Notificaciones push en el navegador (además del correo)
- Exportar a Excel/PDF · Presupuestos y predicción de pagos
- Paginación del historial · Tests (Vitest) · Migración a PostgreSQL para escalar
- App móvil (Capacitor) reutilizando este frontend

---

Hecho con foco en velocidad de captura. Si registrar es más fácil que ignorar, el
sistema realmente se usa. 🚀
