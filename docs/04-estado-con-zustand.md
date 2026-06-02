# 04 — Estado Global con Zustand

> **Proyecto Flex** · Stack: Next.js · Supabase · Zustand · Stripe  
> Nivel: Principiante-Intermedio

---

## ¿Por qué Zustand y no Context API o Redux?

| Herramienta   | Ventaja                        | Inconveniente                         |
|---------------|--------------------------------|---------------------------------------|
| Context API   | Nativa de React, sin instalar  | Re-render de todo el árbol al cambiar |
| Redux Toolkit | Muy potente, DevTools          | Boilerplate, curva de aprendizaje     |
| **Zustand**   | Mínimo boilerplate, rápido     | Menos ecosistema que Redux            |

En Flex necesitamos compartir estado entre componentes que **no son padre e hijo directos**:

- **Carrito de consumiciones** — el botón `+ Añadir` está en cada tarjeta de producto (`src/app/page.jsx`), pero el total y los ítems se muestran en el drawer lateral del mismo archivo y en el modal de mesa.
- **Selección de sala VIP** — el formulario de reserva (`src/app/vip/page.jsx`) necesita mantener `salaId`, `fecha`, `hora` y `duración` mientras el usuario completa los campos.

Zustand resuelve esto con muy poco código y sin contextos anidados.

---

## Instalación

Desde la carpeta del proyecto web:

```bash
cd apps/web
npm install zustand
```

---

## Estructura de stores

```text
apps/web/src/
  store/
    carritoStore.js    ← consumiciones (bebidas, comida) + número de mesa
    reservaStore.js    ← sala VIP seleccionada + fecha, hora y duración
```

---

## 1. `carritoStore.js`

Este store gestiona todo lo que el usuario quiere pedir: los ítems del carrito y el número de mesa que introduce en el modal de confirmación.

```js
// src/store/carritoStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCarritoStore = create(
  persist(
    (set, get) => ({
      items: [],
      mesaNumero: null,   // número visible en la mesa (ej. 7), no el id de BD

      setMesaNumero(numero) {
        set({ mesaNumero: numero })
      },

      agregarItem(producto) {
        set((estado) => {
          const existente = estado.items.find((i) => i.id === producto.id)
          if (existente) {
            return {
              items: estado.items.map((i) =>
                i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
              ),
            }
          }
          return { items: [...estado.items, { ...producto, cantidad: 1 }] }
        })
      },

      quitarItem(productoId) {
        set((estado) => ({
          items: estado.items
            .map((i) => (i.id === productoId ? { ...i, cantidad: i.cantidad - 1 } : i))
            .filter((i) => i.cantidad > 0),
        }))
      },

      eliminarItem(productoId) {
        set((estado) => ({
          items: estado.items.filter((i) => i.id !== productoId),
        }))
      },

      vaciarCarrito() {
        set({ items: [], mesaNumero: null })
      },
    }),
    {
      name: 'flex-carrito',
      // solo persistimos items y mesaNumero; el resto es estado de UI efímero
      partialize: (estado) => ({ items: estado.items, mesaNumero: estado.mesaNumero }),
    }
  )
)
```

> **¿Por qué `mesaNumero` y no `mesaId`?**  
> El usuario introduce el número que ve en la mesa (ej. `7`). La tabla `mesas` en Supabase tiene una columna `numero` (int) y una columna `id` (serial). Para crear el pedido en BD necesitamos el `id`, pero esa resolución la hacemos en la Server Action — el store solo guarda lo que el usuario sabe.

---

## 2. `reservaStore.js`

Refleja exactamente los campos del formulario de `src/app/vip/page.jsx`: sala, fecha, hora de inicio y duración.

```js
// src/store/reservaStore.js
import { create } from 'zustand'

export const useReservaStore = create((set, get) => ({
  salaId: null,        // id entero de salas_vip en BD (null si no hay selección)
  fecha: '',           // string 'YYYY-MM-DD'
  hora: '',            // string 'HH:MM'  (ej. '22:00')
  duracion: '',        // string con número de horas (ej. '2 horas')

  setSala(salaId) {
    set({ salaId })
  },

  setFecha(fecha) {
    set({ fecha })
  },

  setHora(hora) {
    set({ hora })
  },

  setDuracion(duracion) {
    set({ duracion })
  },

  resetReserva() {
    set({ salaId: null, fecha: '', hora: '', duracion: '' })
  },

  // Devuelve los timestamps 'inicio' y 'fin' listos para insertar en BD.
  // Retorna null si faltan campos.
  getTimestamps() {
    const { fecha, hora, duracion } = get()
    if (!fecha || !hora || !duracion) return null
    const horas = parseInt(duracion)   // '2 horas' → 2
    const inicio = new Date(`${fecha}T${hora}:00`)
    const fin = new Date(inicio.getTime() + horas * 60 * 60 * 1000)
    return { inicio: inicio.toISOString(), fin: fin.toISOString() }
  },
}))
```

---

## 3. Uso en componentes React

### 3.1 Botón "+ Añadir" en la página de pedidos

En `src/app/page.jsx` la lógica del carrito actualmente vive en `useState`. La migración a Zustand es directa: sustituir `setCarrito` por las acciones del store.

```jsx
// src/app/page.jsx  (fragmento relevante)
'use client'

import { useCarritoStore } from '@/store/carritoStore'

// Dentro del componente PaginaPedir:
const { items, agregarItem, quitarItem, eliminarItem } = useCarritoStore()

// contar unidades para el badge del botón flotante:
const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0)

// contar total en euros para el footer del drawer:
const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
```

### 3.2 Confirmar pedido con número de mesa

```jsx
// src/app/page.jsx  (modal de mesa)
import { useCarritoStore } from '@/store/carritoStore'
import { confirmarPedido } from '@/app/actions/pedidos'

const { items, mesaNumero, setMesaNumero, vaciarCarrito } = useCarritoStore()

async function handleConfirmar(e) {
  e.preventDefault()
  if (!mesaNumero) return
  await confirmarPedido({ items, mesaNumero })
  vaciarCarrito()
  setPedidoEnviado(true)
}

// En el input del modal:
<input
  type="number"
  value={mesaNumero ?? ''}
  onChange={(e) => setMesaNumero(Number(e.target.value))}
/>
```

### 3.3 Formulario de reserva VIP

En `src/app/vip/page.jsx` cada campo del formulario llama a su setter:

```jsx
// src/app/vip/page.jsx  (fragmento)
'use client'

import { useReservaStore } from '@/store/reservaStore'
import { confirmarReserva } from '@/app/actions/reservas'

const { salaId, fecha, hora, duracion, setSala, setFecha, setHora, setDuracion, resetReserva, getTimestamps } =
  useReservaStore()

// Selector de sala — onClick de cada tarjeta:
<button onClick={() => setSala(s.id)}>...</button>

// Input de fecha:
<input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

// Select de hora:
<select value={hora} onChange={(e) => setHora(e.target.value)}>...</select>

// Select de duración:
<select value={duracion} onChange={(e) => setDuracion(e.target.value)}>...</select>

// Botón confirmar:
async function handleReservar() {
  const timestamps = getTimestamps()
  if (!salaId || !timestamps) return
  await confirmarReserva({ salaId, ...timestamps })
  resetReserva()
  setReservado(true)
}
```

---

## 4. Sincronización de UI sin recargar

Zustand actualiza la UI de forma automática cuando cambia el estado:

```text
Usuario pulsa "Añadir" → agregarItem() → Zustand actualiza items
                       ↓
Todos los componentes suscritos a 'items' se re-renderizan automáticamente
```

**Suscripción selectiva** (importante para rendimiento):

```js
// MAL: se suscribe a TODO el estado → re-render en cualquier cambio
const estado = useCarritoStore()

// BIEN: solo re-renderiza cuando cambia 'items'
const items = useCarritoStore((estado) => estado.items)

// MEJOR: solo re-renderiza cuando cambia el número de unidades
const totalItems = useCarritoStore((estado) =>
  estado.items.reduce((acc, i) => acc + i.cantidad, 0)
)
```

---

## 5. Server Actions

Las Server Actions corren en el servidor (Node.js), por lo que acceden a Supabase con privilegios de servicio. No se puede leer el store de Zustand aquí — los datos llegan como argumento desde el cliente.

### 5.1 `confirmarPedido`

```js
// src/app/actions/pedidos.js
'use server'

import { createClient } from '@/lib/supabase/server'

export async function confirmarPedido({ items, mesaNumero }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Resolver el número de mesa visible → id de BD
  const { data: mesa, error: errorMesa } = await supabase
    .from('mesas')
    .select('id')
    .eq('numero', mesaNumero)
    .single()
  if (errorMesa) throw new Error('Mesa no encontrada')

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert({ mesa_id: mesa.id, cliente_id: user.id, total })
    .select()
    .single()
  if (errorPedido) throw new Error(errorPedido.message)

  const lineas = items.map((item) => ({
    pedido_id:   pedido.id,
    producto_id: item.id,
    cantidad:    item.cantidad,
    precio_unit: item.precio,
  }))

  const { error: errorItems } = await supabase.from('pedido_items').insert(lineas)
  if (errorItems) throw new Error(errorItems.message)

  return pedido
}
```

### 5.2 `confirmarReserva`

```js
// src/app/actions/reservas.js
'use server'

import { createClient } from '@/lib/supabase/server'

export async function confirmarReserva({ salaId, inicio, fin }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Calcular el total a partir del precio_hora de la sala
  const { data: sala, error: errorSala } = await supabase
    .from('salas_vip')
    .select('precio_hora')
    .eq('id', salaId)
    .single()
  if (errorSala) throw new Error('Sala no encontrada')

  const horas = (new Date(fin) - new Date(inicio)) / (1000 * 60 * 60)
  const total = horas * Number(sala.precio_hora)

  const { data: reserva, error } = await supabase
    .from('reservas')
    .insert({ sala_id: salaId, cliente_id: user.id, inicio, fin, total })
    .select()
    .single()
  if (error) throw new Error(error.message)

  return reserva
}
```

> **Nota sobre solapamientos:** La tabla `reservas` tiene una restricción `EXCLUDE USING gist` que impide reservas solapadas en la misma sala. Si lanzas la acción con un rango que choca con una reserva existente, Supabase devolverá un error — captúralo en el componente y muéstraselo al usuario.

---

## Reto Flex 🎸

1. Añade al `carritoStore` una acción `aplicarDescuento(codigo)` que:
   - Acepte los códigos `'FLEX10'` (10 % de descuento) y `'FLEX20'` (20 %).
   - Guarde el porcentaje en el estado (`descuento: 0`).
   - Si el código no es válido, lance un error con el mensaje `'Código no válido'`.

2. Modifica el drawer del carrito en `src/app/page.jsx` para mostrar:
   - Un input donde introducir el código.
   - El total con el descuento aplicado.

3. Persiste `descuento` en localStorage usando el campo `partialize` del middleware `persist`.

> **Pista:** `partialize` recibe el estado completo y devuelve solo el subconjunto que quieres guardar. Añade `descuento` junto a `items` y `mesaNumero`.

---

## Navegación

[← 03 — Interfaz estática](./03-ui-estatica.md) · [05 — Stripe y Edge Functions →](./05-stripe-y-edge-functions.md)
