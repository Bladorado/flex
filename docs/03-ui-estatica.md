# 03 — Interfaz estática: Next.js + maquetación de Flex

> **Objetivo:** crear la estructura de carpetas del proyecto, instalar Next.js y maquetar todas las pantallas con datos estáticos (sin base de datos ni estado global todavía).

---

## Estructura del monorepo

```text
flex/                   ← raíz del monorepo
  apps/
    web/                ← aquí va Next.js
  docs/
  supabase/
  package.json
```

---

## 1. Crear `apps/web` con Next.js

Desde la raíz del proyecto:

```bash
mkdir apps
npx create-next-app@latest web --no-typescript --tailwind --app --src-dir --import-alias "@/*"
cd apps/web
npm install lucide-react
npm run dev
```

---

## 2. Tailwind v4 y tipografía

Con Tailwind v4 no hay `tailwind.config.js`. Todo va en CSS.

Las fuentes se cargan desde Google Fonts en el `<head>` del layout:

- **Inter** — cuerpo, etiquetas, navegación
- **Cormorant Garant** — títulos `h1 / h2 / h3` (serif elegante, coherente con el logo)

```jsx
// src/app/layout.jsx
import './globals.css'
import Shell from '@/components/Shell'

export const metadata = { title: 'Flex — Live Sessions', description: 'Tu noche, tu ritmo' }

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  )
}
```

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-gold-400: #D4A843;
  --color-gold-500: #C9A030;
  --color-gold-600: #A07820;
  --font-display: 'Cormorant Garant', Georgia, serif;
}

:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  @apply antialiased;
}

h1, h2, h3 { font-family: 'Cormorant Garant', Georgia, serif; }

::-webkit-scrollbar { @apply w-1; }
::-webkit-scrollbar-track { @apply bg-zinc-900; }
::-webkit-scrollbar-thumb { @apply bg-zinc-700 rounded-full; }
```

---

## 3. Shell — layout responsivo

El componente `Shell` decide qué navegación mostrar según el tamaño de pantalla:

- **Móvil** — barra de navegación inferior fija (estilo app nativa)
- **Desktop** — sidebar lateral estático

Las rutas `/login` y `/register` omiten la navegación por completo.

```jsx
// src/components/Shell.jsx  (simplificado)
'use client'

const AUTH_ROUTES = ['/login', '/register']

export default function Shell({ children }) {
  const pathname = usePathname()
  if (AUTH_ROUTES.includes(pathname)) return <>{children}</>

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar solo en desktop */}
      <div className="hidden lg:block"><Sidebar /></div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header móvil */}
        <header className="lg:hidden ...">FLEX</header>
        {/* Contenido con padding inferior para la barra */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Barra inferior solo en móvil */}
      <BottomNav />
    </div>
  )
}
```

### Barra de navegación móvil

Cinco slots fijos en la parte inferior:

| Slot | Destino |
| ---- | ------- |
| Pedir | `/` |
| VIP | `/vip` |
| Mi área | `/mi-area` |
| Perfil | `/perfil` |
| Gestión *(botón elevado central)* | Despliega panel con Staff · Porteros · Admin |

El botón **Gestión** es un círculo elevado (`-translate-y-3`) que al pulsarse abre un panel flotante encima de la barra con los tres accesos de gestión interna.

---

## 4. Sidebar (desktop)

El sidebar incluye:

- Logo SVG (`FlexLogo`) — `src/components/FlexLogo.jsx`
- Dos grupos de navegación: **Cliente** y **Gestión**
- Zona de usuario en la parte inferior: clic navega a `/perfil`

```jsx
// src/components/Sidebar.jsx  (fragmento)
const NAV_CLIENTE = [
  { icon: ShoppingCart, label: 'Pedir',     href: '/' },
  { icon: Crown,        label: 'Salas VIP', href: '/vip' },
  { icon: User,         label: 'Mi área',   href: '/mi-area' },
]

const NAV_STAFF = [
  { icon: ShieldCheck,     label: 'Panel Staff', href: '/staff' },
  { icon: QrCode,          label: 'Porteros',    href: '/porteros' },
  { icon: LayoutDashboard, label: 'Admin',       href: '/admin' },
]
```

### Logo SVG

El logo es un componente SVG puro (`src/components/FlexLogo.jsx`) que renderiza:

- **FLEX** en tipografía serif itálica con degradado dorado
- Línea separadora fina
- **LIVE SESSIONS** en letras espaciadas

No depende de imágenes externas ni fuentes de Google.

---

## 5. Páginas

### 5.1 Auth — `/login` y `/register`

Layout split: foto de Unsplash a la izquierda, formulario a la derecha. En móvil la foto actúa como fondo tenue.

```jsx
// Foto de ambiente nocturno desde Unsplash (sin coste, sin clave de API)
<img src="https://images.unsplash.com/photo-XXXXX?w=1200&auto=format&fit=crop&q=80" />
```

Ambas páginas están fuera del `Shell` (sin sidebar ni barra inferior).

---

### 5.2 Pedir a mesa — `/`

El cliente filtra por categoría, añade productos y envía el pedido.

**Datos estáticos:** 12 productos con `nombre`, `categoria`, `precio` e `img` (URL de Unsplash).

**Estado local:**

| Variable | Descripción |
| -------- | ----------- |
| `cat` | Categoría activa (Todo / Bebida / Comida) |
| `carrito` | Array de `{ ...producto, cantidad }` |
| `carritoAbierto` | Visibilidad del drawer lateral |
| `pedidoEnviado` | Banner de confirmación temporal |
| `modalMesa` | Visibilidad del modal de número de mesa |
| `mesa` | Número de mesa introducido por el usuario |

**Flujo del carrito:**

1. Botón flotante dorado (esquina inferior derecha) muestra el número de ítems
2. Al pulsarlo se abre un **drawer** deslizable desde la derecha (`translate-x-full → translate-x-0`)
3. Al pulsar **Enviar pedido** aparece un **modal** preguntando el número de mesa
4. Al confirmar se muestra el banner de éxito y el drawer se cierra automáticamente

```jsx
// Drawer carrito
<div className={`fixed inset-y-0 right-0 z-30 w-full sm:w-96 bg-zinc-900 transition-transform duration-300 ${
  carritoAbierto ? 'translate-x-0' : 'translate-x-full'
}`}>
```

---

### 5.3 Dashboard Admin — `/admin`

Tabs: **Usuarios** / **Productos**. Modales para crear nuevas entradas. Botón eliminar por fila.

```text
Roles: Cliente · Staff · Portero · Admin
Categorías: Bebida · Comida
```

---

### 5.4 Dashboard Staff — `/staff`

Cada pedido puede avanzar por tres estados:

```text
pendiente → preparando → completado
```

La transición se gestiona con dos objetos de configuración:

```js
const SIGUIENTE = { pendiente: 'preparando', preparando: 'completado' }

const ESTADOS = {
  pendiente:  { label: 'Pendiente',  color: 'text-amber-400',  icon: Clock },
  preparando: { label: 'Preparando', color: 'text-blue-400',   icon: ChefHat },
  completado: { label: 'Completado', color: 'text-emerald-400',icon: CheckCircle },
}
```

Filtros: `todos / pendiente / preparando / completado`. Cuatro tarjetas de estadísticas en la cabecera.

---

### 5.5 Dashboard Porteros — `/porteros`

Validación manual de QR. Formato válido: `FLEX-XXXX` (9 caracteres). Resultado visible 4 segundos, después se añade al historial.

---

### 5.6 Reserva VIP — `/vip`

| Sala | Precio | Capacidad | Estado |
| ---- | ------ | --------- | ------ |
| Sala Roja | 150 €/h | 10 | Disponible |
| Sala Negra | 200 €/h | 15 | Ocupada |
| Sala Dorada | 300 €/h | 20 | Disponible |

Flujo: seleccionar sala → fecha + hora + duración → precio calculado automáticamente → confirmar → pantalla de confirmación.

---

### 5.7 Mi área — `/mi-area`

| Tab | Contenido |
| --- | --------- |
| Entradas | QR placeholder + evento, fecha, tipo, código |
| Mis zonas | Zonas asignadas con descripción y evento |
| Pedidos | Historial con ítems, estado (Entregado / En camino) y total |

---

### 5.8 Perfil — `/perfil`

Accesible desde el avatar del sidebar (desktop) o el tab Perfil de la barra inferior (móvil).

Cuatro pestañas:

| Tab | Contenido |
| --- | --------- |
| Datos personales | Nombre, email, teléfono, fecha nacimiento, subir avatar |
| Pago | Tarjetas guardadas + formulario nueva tarjeta (maqueta Stripe) |
| Seguridad | Cambiar contraseña · Sesiones activas · Eliminar cuenta |
| Notificaciones | Toggles: pedidos, entradas, VIP, promociones, newsletter |

La sección de pago muestra una **previsualización visual** de la tarjeta que se actualiza en tiempo real mientras el usuario escribe.

---

## 6. Estructura final de archivos

```text
apps/web/src/
  app/
    layout.jsx              ← Google Fonts + Shell
    globals.css             ← Tailwind v4 + tema dorado + tipografía
    page.jsx                ← pedir comida/bebida (drawer carrito + modal mesa)
    login/
      page.jsx              ← login (sin Shell)
    register/
      page.jsx              ← registro (sin Shell)
    perfil/
      page.jsx              ← configuración de cuenta y pago
    admin/
      page.jsx              ← dashboard admin
    staff/
      page.jsx              ← dashboard staff (3 estados)
    porteros/
      page.jsx              ← scanner QR porteros
    vip/
      page.jsx              ← reserva salas VIP
    mi-area/
      page.jsx              ← área personal cliente
  components/
    Shell.jsx               ← layout responsivo + barra inferior móvil
    Sidebar.jsx             ← navegación desktop + link a perfil
    FlexLogo.jsx            ← logo SVG puro
```

---

## Navegación

[← 02 — Seguridad con RLS](./02-seguridad-rls.md) · [Teoría previa: Estado en React →](./teoria/04-teoria.md)
