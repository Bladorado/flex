'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'

const USUARIOS_INIT = [
  { id: 1, nombre: 'Alex García',    email: 'alex@flex.es',    rol: 'Cliente', activo: true  },
  { id: 2, nombre: 'Sara Martín',    email: 'sara@flex.es',    rol: 'Staff',   activo: true  },
  { id: 3, nombre: 'Carlos Ruiz',    email: 'carlos@flex.es',  rol: 'Portero', activo: true  },
  { id: 4, nombre: 'Laura Pérez',    email: 'laura@flex.es',   rol: 'Cliente', activo: false },
]

const PRODUCTOS_INIT = [
  { id: 1, nombre: 'Cerveza Artesana',   categoria: 'Bebida', precio: 4.5,  activo: true  },
  { id: 2, nombre: 'Gin Tonic Premium',  categoria: 'Bebida', precio: 9.0,  activo: true  },
  { id: 3, nombre: 'Nachos con guacamole',categoria:'Comida', precio: 7.0,  activo: true  },
  { id: 4, nombre: 'Hamburguesa Flex',   categoria: 'Comida', precio: 11.0, activo: false },
]

const TABS = ['Usuarios', 'Productos']

const ROL_COLOR = {
  Cliente: 'bg-blue-500/20 text-blue-400',
  Staff:   'bg-amber-500/20 text-amber-400',
  Portero: 'bg-purple-500/20 text-purple-400',
  Admin:   'bg-red-500/20 text-red-400',
}

export default function PaginaAdmin() {
  const [tab, setTab] = useState('Usuarios')
  const [usuarios, setUsuarios] = useState(USUARIOS_INIT)
  const [productos, setProductos] = useState(PRODUCTOS_INIT)
  const [modalUsuario, setModalUsuario] = useState(false)
  const [modalProducto, setModalProducto] = useState(false)
  const [formU, setFormU] = useState({ nombre: '', email: '', rol: 'Cliente' })
  const [formP, setFormP] = useState({ nombre: '', categoria: 'Bebida', precio: '' })

  function crearUsuario() {
    if (!formU.nombre || !formU.email) return
    setUsuarios(prev => [...prev, { id: Date.now(), ...formU, activo: true }])
    setFormU({ nombre: '', email: '', rol: 'Cliente' })
    setModalUsuario(false)
  }

  function crearProducto() {
    if (!formP.nombre || !formP.precio) return
    setProductos(prev => [...prev, { id: Date.now(), ...formP, precio: parseFloat(formP.precio), activo: true }])
    setFormP({ nombre: '', categoria: 'Bebida', precio: '' })
    setModalProducto(false)
  }

  function eliminarUsuario(id) { setUsuarios(prev => prev.filter(u => u.id !== id)) }
  function eliminarProducto(id) { setProductos(prev => prev.filter(p => p.id !== id)) }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Panel de administración</h1>
        <p className="text-zinc-500 text-sm mt-1">Gestión de usuarios y productos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Usuarios totales', valor: usuarios.length },
          { label: 'Usuarios activos', valor: usuarios.filter(u => u.activo).length },
          { label: 'Productos',        valor: productos.length },
          { label: 'Productos activos',valor: productos.filter(p => p.activo).length },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-100 mt-1">{stat.valor}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-gold-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tabla usuarios */}
      {tab === 'Usuarios' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Usuarios</h2>
            <button
              onClick={() => setModalUsuario(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-zinc-950 text-sm font-semibold rounded-lg"
            >
              <Plus size={16} /> Nuevo usuario
            </button>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-125">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-100 font-medium">{u.nombre}</td>
                    <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLOR[u.rol] || 'bg-zinc-700 text-zinc-400'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => eliminarUsuario(u.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla productos */}
      {tab === 'Productos' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Productos</h2>
            <button
              onClick={() => setModalProducto(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-zinc-950 text-sm font-semibold rounded-lg"
            >
              <Plus size={16} /> Nuevo producto
            </button>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-125">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-left px-4 py-3">Precio</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-100 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.categoria}</td>
                    <td className="px-4 py-3 text-gold-400 font-semibold">{p.precio.toFixed(2)} €</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => eliminarProducto(p.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal usuario */}
      {modalUsuario && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-96">
            <h3 className="text-lg font-bold text-zinc-100 mb-4">Nuevo usuario</h3>
            <div className="space-y-3">
              <input
                placeholder="Nombre completo"
                value={formU.nombre}
                onChange={e => setFormU(p => ({ ...p, nombre: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-gold-500"
              />
              <input
                placeholder="Email"
                value={formU.email}
                onChange={e => setFormU(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-gold-500"
              />
              <select
                value={formU.rol}
                onChange={e => setFormU(p => ({ ...p, rol: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-500"
              >
                {['Cliente', 'Staff', 'Portero', 'Admin'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalUsuario(false)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800">
                Cancelar
              </button>
              <button onClick={crearUsuario} className="flex-1 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-zinc-950 text-sm font-semibold">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal producto */}
      {modalProducto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-96">
            <h3 className="text-lg font-bold text-zinc-100 mb-4">Nuevo producto</h3>
            <div className="space-y-3">
              <input
                placeholder="Nombre del producto"
                value={formP.nombre}
                onChange={e => setFormP(p => ({ ...p, nombre: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-gold-500"
              />
              <select
                value={formP.categoria}
                onChange={e => setFormP(p => ({ ...p, categoria: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-500"
              >
                {['Bebida', 'Comida'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                placeholder="Precio (€)"
                type="number"
                value={formP.precio}
                onChange={e => setFormP(p => ({ ...p, precio: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-gold-500"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalProducto(false)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800">
                Cancelar
              </button>
              <button onClick={crearProducto} className="flex-1 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-zinc-950 text-sm font-semibold">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
