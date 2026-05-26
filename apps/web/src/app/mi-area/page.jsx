'use client'

import { useState } from 'react'
import { MapPin, ShoppingBag } from 'lucide-react'


const ZONAS = [
  { id: 1, nombre: 'Sala Roja VIP', descripcion: 'Reserva 23:00–01:00 · 2h', evento: 'Jazz Nights', fecha: '25 mayo' },
]

const PEDIDOS = [
  {
    id: 1, fecha: '25 mayo · 23:14', mesa: 'Mesa 7', estado: 'completado',
    items: [{ nombre: 'Gin Tonic Premium', cantidad: 2, precio: 9.0 }, { nombre: 'Nachos', cantidad: 1, precio: 7.0 }],
  },
  {
    id: 2, fecha: '25 mayo · 00:02', mesa: 'Mesa 7', estado: 'pendiente',
    items: [{ nombre: 'Mojito', cantidad: 2, precio: 8.5 }],
  },
]

const TABS = [
  { id: 'zonas', label: 'Mis zonas', icon: MapPin },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
]

export default function PaginaMiArea() {
  const [tab, setTab] = useState('zonas')

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Mi área</h1>
        <p className="text-zinc-500 text-sm mt-1">Alex García · Cliente</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.id ? 'bg-gold-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Zonas */}
      {tab === 'zonas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {ZONAS.map(z => (
            <div key={z.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <MapPin size={18} className="text-gold-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-zinc-100">{z.nombre}</h3>
                  <p className="text-zinc-500 text-sm">{z.descripcion}</p>
                </div>
              </div>
              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-xs text-zinc-500">
                <span>{z.evento}</span>
                <span>{z.fecha}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pedidos */}
      {tab === 'pedidos' && (
        <div className="space-y-4 max-w-2xl">
          {PEDIDOS.map(p => {
            const total = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0)
            return (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-zinc-100 font-medium text-sm">{p.mesa}</p>
                    <p className="text-zinc-500 text-xs">{p.fecha}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.estado === 'completado'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                    }`}>
                    {p.estado === 'completado' ? 'Entregado' : 'En camino'}
                  </span>
                </div>
                <ul className="space-y-1 border-t border-zinc-800 pt-3">
                  {p.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{item.cantidad}× {item.nombre}</span>
                      <span className="text-zinc-500">{(item.precio * item.cantidad).toFixed(2)} €</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800">
                  <span className="text-zinc-500 text-xs">Total</span>
                  <span className="text-gold-400 font-bold">{total.toFixed(2)} €</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
