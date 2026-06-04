# 06 — Productos

> **Proyecto Flex** · Stack: Next.js · Supabase · Zustand · Stripe  
> Nivel: Principiante-Intermedio

---

## Introducción

En este apunte conectamos los productos y las salas reales de la base de datos con la aplicación. Al terminar:

1. Los productos estarán en `seed.sql` y se cargarán automáticamente al iniciar Supabase local.
2. La página principal leerá los productos desde Supabase en el servidor (Server Component).
3. La página VIP leerá las salas desde Supabase en el servidor.
4. El administrador podrá crear, editar y borrar productos desde su panel.

---

## 1. Generar productos en `seed.sql`

El archivo `supabase/seed.sql` se ejecuta automáticamente cada vez que haces `npx supabase db reset`. Añade los productos al final del archivo:

```sql
-- ── Productos ────────────────────────────────────────────────────────────────

-- Bebidas
insert into public.productos (nombre, descripcion, precio, categoria, disponible) values
  ('Agua mineral 50cl',  'Agua sin gas botella pequeña',          1.50, 'bebida', true),
  ('Refresco cola',      'Lata 33cl fría',                        2.00, 'bebida', true),
  ('Cerveza artesana',   'IPA local de barril, 33cl',             3.50, 'bebida', true),
  ('Gin-tonic premium',  'Ginebra Hendrick''s con tónica fever',  9.00, 'bebida', true),
  ('Mojito',             'Ron blanco, menta, lima y azúcar',      8.50, 'bebida', true),
  ('Zumo de naranja',    'Exprimido al momento',                   3.00, 'bebida', true);

-- Comidas
insert into public.productos (nombre, descripcion, precio, categoria, disponible) values
  ('Nachos con guacamole', 'Tortillas crujientes con guac casero',  7.50, 'comida', true),
  ('Patatas bravas',       'Con salsa picante y alioli',            5.00, 'comida', true),
  ('Tabla de quesos',      'Selección de quesos con mermelada',    12.00, 'comida', true),
  ('Alitas BBQ',           '8 unidades con salsa barbacoa',         9.00, 'comida', true),
  ('Burger Flex',          'Ternera, cheddar, bacon y pepinillos', 13.00, 'comida', false);

-- Packs
insert into public.productos (nombre, descripcion, precio, categoria, disponible) values
  ('Pack Bienvenida',  '2 gin-tonics + nachos + patatas bravas', 28.00, 'pack', true),
  ('Pack Cumpleaños',  'Botella de cava + tabla de quesos',      45.00, 'pack', true),
  ('Pack Noche VIP',   'Botella premium + 4 refrescos + alitas', 60.00, 'pack', true);
```

> `disponible = false` en la Burger Flex permite probar que el frontend la oculta o la muestra como agotada.

### Imágenes de productos

La columna `imagen_url` guarda una URL pública del bucket `productos` de Supabase Storage. Para añadir imágenes:

1. Ve a **Storage → productos** en el Dashboard (`http://localhost:54323`).
2. Sube una imagen por producto (jpg o webp, nombre descriptivo: `cerveza-artesana.jpg`).
3. Actualiza `imagen_url` con el SQL de abajo. Ajusta la URL base según tu entorno:

```sql
-- Local:      http://localhost:54321/storage/v1/object/public/productos
-- Producción: https://<proyecto>.supabase.co/storage/v1/object/public/productos

update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/agua-mineral.jpg'      where nombre = 'Agua mineral 50cl';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/refresco-cola.jpg'     where nombre = 'Refresco cola';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/cerveza-artesana.jpg'  where nombre = 'Cerveza artesana';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/gintonic-premium.jpg'  where nombre = 'Gin-tonic premium';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/mojito.jpg'            where nombre = 'Mojito';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/zumo-naranja.jpg'      where nombre = 'Zumo de naranja';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/nachos-guacamole.jpg'  where nombre = 'Nachos con guacamole';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/patatas-bravas.jpg'    where nombre = 'Patatas bravas';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/tabla-quesos.jpg'      where nombre = 'Tabla de quesos';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/alitas-bbq.jpg'        where nombre = 'Alitas BBQ';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/burger-flex.jpg'       where nombre = 'Burger Flex';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/pack-bienvenida.jpg'   where nombre = 'Pack Bienvenida';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/pack-cumpleanos.jpg'   where nombre = 'Pack Cumpleaños';
update public.productos set imagen_url = 'http://localhost:54321/storage/v1/object/public/productos/pack-noche-vip.jpg'    where nombre = 'Pack Noche VIP';
```

> Si `imagen_url` es `null`, muestra un placeholder en el frontend (`/img/producto-sin-imagen.jpg`) para que la carta nunca quede rota.

---

## 2. Cargar productos desde Supabase (Server Component)

La página principal (`src/app/page.jsx`) era un Client Component que cargaba productos con `useEffect`. Ahora la convertimos en un **Server Component**: Next.js ejecuta la consulta en el servidor antes de enviar el HTML al navegador, lo que es más rápido y no necesita estado de carga.

### 2.1 Crear el cliente de servidor

```
apps/web/src/
  lib/
    supabase-server.js    ← cliente para Server Components
```

```js
// src/lib/supabase-server.js
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

> Usamos `NEXT_PUBLIC_` porque son valores públicos (URL y anon key). Las políticas RLS del apunte 02 controlan qué puede leer este cliente.

Comprueba que `.env.local` tiene los valores correctos:

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Convertir `page.jsx` en Server Component

Elimina `'use client'` y el `useEffect`. La función puede ser `async` directamente:

```jsx
// src/app/page.jsx  — Server Component (sin 'use client')
import { createServerClient } from '@/lib/supabase-server'
import CartaClient from '@/components/CartaClient'

export default async function PaginaPedir() {
  const supabase = createServerClient()

  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre, descripcion, precio, categoria, imagen_url')
    .eq('disponible', true)
    .order('categoria')

  if (error) {
    return <p className="text-red-400 p-8">Error al cargar la carta.</p>
  }

  return <CartaClient productos={productos} />
}
```

El componente `CartaClient` recibe los productos como prop y mantiene la lógica del carrito (filtros, drawer, modal). Sigue siendo Client Component porque usa estado y eventos:

```jsx
// src/components/CartaClient.jsx
'use client'

import { useState } from 'react'
import { useCarritoStore } from '@/store/carritoStore'
import { ShoppingCart, Plus, Minus, X } from 'lucide-react'

const CATEGORIAS = ['Todo', 'Bebida', 'Comida', 'Pack']

export default function CartaClient({ productos }) {
  const { items, mesaNumero, setMesaNumero, agregarItem, quitarItem, vaciarCarrito } = useCarritoStore()
  const totalItems = useCarritoStore((s) => s.items.reduce((acc, i) => acc + i.cantidad, 0))
  const total      = useCarritoStore((s) => s.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0))

  const [cat, setCat]                       = useState('Todo')
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [pedidoEnviado, setPedidoEnviado]   = useState(false)
  const [modalMesa, setModalMesa]           = useState(false)

  const productosFiltrados =
    cat === 'Todo'
      ? productos
      : productos.filter((p) => p.categoria.toLowerCase() === cat.toLowerCase())

  // ... resto del JSX igual que antes, usando productosFiltrados
}
```

### ¿Por qué separar Server y Client?

| | Server Component (`page.jsx`) | Client Component (`CartaClient.jsx`) |
|---|---|---|
| Ejecuta en | Servidor | Navegador |
| Puede hacer `async/await` directo | ✅ | ❌ (necesita `useEffect`) |
| Puede usar `useState`, eventos | ❌ | ✅ |
| SEO y velocidad inicial | Mejor | Normal |

---

## 3. Cargar salas desde Supabase

La página VIP (`src/app/vip/page.jsx`) también puede ser Server Component para cargar las salas antes de renderizar.

```jsx
// src/app/vip/page.jsx  — Server Component
import { createServerClient } from '@/lib/supabase-server'
import VipClient from '@/components/VipClient'

export default async function PaginaVip() {
  const supabase = createServerClient()

  const { data: salas, error } = await supabase
    .from('salas')
    .select('id, nombre, capacidad, precio_hora, descripcion, imagen_url')
    .order('precio_hora')

  if (error) {
    return <p className="text-red-400 p-8">Error al cargar las salas.</p>
  }

  return <VipClient salas={salas} />
}
```

`VipClient` recibe `salas` como prop y mantiene toda la lógica del formulario de reserva (selección de sala, fecha, hora, duración):

```jsx
// src/components/VipClient.jsx
'use client'

import { useState } from 'react'

export default function VipClient({ salas }) {
  const [salaSeleccionada, setSalaSeleccionada] = useState(salas[0]?.id ?? null)
  const [fecha, setFecha]       = useState('')
  const [hora, setHora]         = useState('')
  const [duracion, setDuracion] = useState('2')
  const [reservado, setReservado] = useState(false)

  const sala = salas.find((s) => s.id === salaSeleccionada)
  const subtotal = sala ? sala.precio_hora * parseInt(duracion) : 0

  // ... JSX con el formulario y la lista de salas
}
```

---

## 4. CRUD de productos para el administrador

El administrador gestiona el catálogo desde `/admin/productos`. Esta sección cubre las cuatro operaciones: listar, crear, editar y borrar.

### 4.1 Server Actions

Usa **Server Actions** de Next.js para las escrituras. Se ejecutan en el servidor y no exponen la lógica al cliente.

```
apps/web/src/
  lib/
    actions/
      productos.js    ← Server Actions para CRUD de productos
```

```js
// src/lib/actions/productos.js
'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function crearProducto(formData) {
  const supabase = createServerClient()

  const { error } = await supabase.from('productos').insert({
    nombre:      formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    precio:      parseFloat(formData.get('precio')),
    categoria:   formData.get('categoria'),
    disponible:  formData.get('disponible') === 'true',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/productos')
}

export async function editarProducto(id, formData) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('productos')
    .update({
      nombre:      formData.get('nombre'),
      descripcion: formData.get('descripcion'),
      precio:      parseFloat(formData.get('precio')),
      categoria:   formData.get('categoria'),
      disponible:  formData.get('disponible') === 'true',
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/productos')
}

export async function borrarProducto(id) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/productos')
}
```

> `revalidatePath` invalida la caché de Next.js para esa ruta, así la lista de productos se actualiza en la siguiente visita sin necesidad de recargar manualmente.

### 4.2 Página de administración

```jsx
// src/app/admin/productos/page.jsx  — Server Component
import { createServerClient } from '@/lib/supabase-server'
import AdminProductosClient from '@/components/AdminProductosClient'

export default async function AdminProductos() {
  const supabase = createServerClient()

  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .order('categoria', { ascending: true })

  if (error) {
    return <p className="text-red-400 p-8">Error al cargar productos.</p>
  }

  return <AdminProductosClient productos={productos} />
}
```

### 4.3 Componente cliente del panel

```jsx
// src/components/AdminProductosClient.jsx
'use client'

import { useState } from 'react'
import { crearProducto, editarProducto, borrarProducto } from '@/lib/actions/productos'

const CATEGORIAS = ['bebida', 'comida', 'pack']

const VACIO = { nombre: '', descripcion: '', precio: '', categoria: 'bebida', disponible: true }

export default function AdminProductosClient({ productos }) {
  const [formulario, setFormulario] = useState(VACIO)
  const [editandoId, setEditandoId] = useState(null)   // null → modo crear
  const [error, setError]           = useState(null)
  const [enviando, setEnviando]     = useState(false)

  function cargarEnFormulario(producto) {
    setEditandoId(producto.id)
    setFormulario({
      nombre:      producto.nombre,
      descripcion: producto.descripcion,
      precio:      producto.precio,
      categoria:   producto.categoria,
      disponible:  producto.disponible,
    })
  }

  function cancelar() {
    setEditandoId(null)
    setFormulario(VACIO)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const data = new FormData()
    Object.entries(formulario).forEach(([k, v]) => data.set(k, String(v)))

    try {
      if (editandoId) {
        await editarProducto(editandoId, data)
      } else {
        await crearProducto(data)
      }
      cancelar()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function handleBorrar(id) {
    if (!confirm('¿Seguro que quieres borrar este producto?')) return
    try {
      await borrarProducto(id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Gestión de productos</h1>

      {/* ── Formulario crear / editar ── */}
      <form onSubmit={handleSubmit} className="bg-zinc-800 p-4 rounded-xl space-y-3">
        <h2 className="font-semibold text-white">
          {editandoId ? 'Editar producto' : 'Nuevo producto'}
        </h2>

        <input
          required
          placeholder="Nombre"
          value={formulario.nombre}
          onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
          className="w-full bg-zinc-700 text-white rounded px-3 py-2 text-sm"
        />
        <input
          placeholder="Descripción"
          value={formulario.descripcion}
          onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
          className="w-full bg-zinc-700 text-white rounded px-3 py-2 text-sm"
        />
        <div className="flex gap-3">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Precio"
            value={formulario.precio}
            onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })}
            className="w-32 bg-zinc-700 text-white rounded px-3 py-2 text-sm"
          />
          <select
            value={formulario.categoria}
            onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
            className="bg-zinc-700 text-white rounded px-3 py-2 text-sm"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={formulario.disponible}
              onChange={(e) => setFormulario({ ...formulario, disponible: e.target.checked })}
            />
            Disponible
          </label>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={enviando}
            className="bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm"
          >
            {enviando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={cancelar}
              className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* ── Lista de productos ── */}
      <table className="w-full text-sm text-zinc-300">
        <thead className="text-xs uppercase text-zinc-500 border-b border-zinc-700">
          <tr>
            <th className="text-left py-2">Nombre</th>
            <th className="text-left py-2">Categoría</th>
            <th className="text-right py-2">Precio</th>
            <th className="text-center py-2">Disponible</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
              <td className="py-2 font-medium text-white">{p.nombre}</td>
              <td className="py-2">{p.categoria}</td>
              <td className="py-2 text-right">{p.precio.toFixed(2)} €</td>
              <td className="py-2 text-center">{p.disponible ? '✅' : '❌'}</td>
              <td className="py-2 text-right space-x-2">
                <button
                  onClick={() => cargarEnFormulario(p)}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleBorrar(p.id)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 4.4 Proteger la ruta con middleware

La ruta `/admin` solo debe ser accesible para usuarios con `rol = 'admin'`. Añade la comprobación en el middleware o al inicio de la página:

```jsx
// Al principio de src/app/admin/productos/page.jsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export default async function AdminProductos() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') redirect('/')

  // ... resto de la página
}
```

---

## 5. Verificar que todo funciona

### Productos en la carta

1. `npx supabase db reset` para ejecutar `seed.sql` con los productos.
2. `npm run dev` en `apps/web`.
3. Abre `http://localhost:3000` → deberías ver los 14 productos (menos Burger Flex, que está `disponible = false`).

### Salas en la página VIP

1. Abre `http://localhost:3000/vip` → las salas deben cargarse desde la BD.
2. Si la lista está vacía, inserta salas de prueba desde el Studio SQL Editor.

### Panel de administrador

1. Inicia sesión con un usuario de `rol = 'admin'`.
2. Ve a `http://localhost:3000/admin/productos`.
3. Crea un producto → aparece en la lista.
4. Edítalo → los cambios se reflejan.
5. Bórralo → desaparece de la lista y de la carta.

---

## Errores frecuentes

| Error | Causa | Solución |
|-------|-------|----------|
| `Failed to fetch` | Supabase no está corriendo | `npx supabase start` |
| `JWT expired` | `anon key` desactualizada | Copia la clave de `npx supabase status` |
| `new row violates row-level security` | Falta política INSERT para admin | Añade política RLS del apunte 02 |
| Lista de salas vacía | Tabla `salas` sin datos | Inserta salas desde el Studio |
| Ruta `/admin` redirige a `/` | Usuario sin `rol = 'admin'` | Comprueba `public.perfiles` en el Studio |

---

## Resumen

```
supabase/seed.sql
  → INSERT productos (bebidas, comidas, packs)

src/lib/supabase-server.js         ← cliente para Server Components

src/app/page.jsx                   ← Server Component
  → supabase.from('productos').select(...)   carga la carta

src/app/vip/page.jsx               ← Server Component
  → supabase.from('salas').select(...)       carga las salas

src/lib/actions/productos.js       ← Server Actions
  crearProducto / editarProducto / borrarProducto

src/app/admin/productos/page.jsx   ← panel de admin (solo rol = 'admin')
src/components/AdminProductosClient.jsx
```
