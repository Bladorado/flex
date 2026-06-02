-- Devuelve el rol del usuario autenticado actualmente.
-- 'security definer' significa que se ejecuta con permisos del creador (postgres),
-- no con los del usuario que llama. Así evitamos recursión infinita en las políticas.
create or replace function public.mi_rol()
returns text
language sql
stable          -- el resultado no cambia durante la misma transacción
security definer
as $$
  select rol from public.perfiles where id = auth.uid()
$$;

---1. Estructura de migraciones: esquema vs. políticas
---Las migraciones de Supabase se aplican en orden por timestamp. En Flex separamos la seguridad en dos archivos:

--supabase/migrations/
 -- 20260513160558_esquema_inicial.sql   ← tablas, triggers, datos de ejemplo + ENABLE RLS
--  20260513160559_politicas_rls.sql     ← función mi_rol() + todas las políticas

--Activar RLS (en _esquema_inicial.sql)
alter table public.perfiles      enable row level security;
alter table public.mesas         enable row level security;
alter table public.productos     enable row level security;
alter table public.pedidos       enable row level security;
alter table public.pedido_items  enable row level security;
alter table public.salas_vip     enable row level security;
alter table public.reservas      enable row level security;

--2. Políticas para perfiles

-- Un cliente ve y edita SOLO su propio perfil
create policy "perfil propio: lectura"
  on public.perfiles for select
  using ( id = auth.uid() );

create policy "perfil propio: edición"
  on public.perfiles for update
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

-- El admin ve todos los perfiles
create policy "admin: lectura total perfiles"
  on public.perfiles for select
  using ( public.mi_rol() = 'admin' );

-- El trigger de registro (apunte 01) necesita insertar con service_role,
-- que ignora RLS. No necesitamos política de INSERT para clientes.


--3. Políticas para mesas y salas_vip

-- Todos los usuarios autenticados pueden VER mesas y salas (para la UI)
create policy "autenticado: ver mesas"
  on public.mesas for select
  using ( auth.role() = 'authenticated' );

create policy "autenticado: ver salas vip"
  on public.salas_vip for select
  using ( auth.role() = 'authenticated' );

-- Solo admin puede crear/modificar/borrar mesas y salas
create policy "admin: gestionar mesas"
  on public.mesas for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );

create policy "admin: gestionar salas vip"
  on public.salas_vip for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );


--4. Políticas para productos
-- Cualquier usuario autenticado ve el menú
create policy "autenticado: ver productos"
  on public.productos for select
  using ( auth.role() = 'authenticated' );

-- Staff y admin gestionan el menú (crear, editar, borrar)
create policy "staff/admin: gestionar productos"
  on public.productos for all
  using ( public.mi_rol() in ('staff', 'admin') )
  with check ( public.mi_rol() in ('staff', 'admin') );

--5. Políticas para pedidos

-- Un cliente ve SOLO sus propios pedidos
create policy "cliente: ver sus pedidos"
  on public.pedidos for select
  using (
    cliente_id = auth.uid()
    and public.mi_rol() = 'cliente'
  );

-- Un cliente puede CREAR pedidos (solo como su propio usuario)
create policy "cliente: crear pedidos"
  on public.pedidos for insert
  with check (
    cliente_id = auth.uid()
    and public.mi_rol() = 'cliente'
  );

-- Staff ve TODOS los pedidos (necesita ver el panel de barra en tiempo real)
-- No filtramos por piso aquí; el filtro de piso lo hace la query de la app,
-- pero si el staff intenta leer pedidos de otro local (en un sistema multi-tenant)
-- el RLS lo impediría a nivel de proyecto.
create policy "staff: ver todos los pedidos"
  on public.pedidos for select
  using ( public.mi_rol() in ('staff', 'admin') );

-- Staff puede actualizar el estado del pedido (pendiente → en_barra → listo…)
create policy "staff: actualizar estado pedido"
  on public.pedidos for update
  using ( public.mi_rol() in ('staff', 'admin') )
  with check ( public.mi_rol() in ('staff', 'admin') );

-- Admin puede borrar pedidos (para limpiar datos de prueba, por ejemplo)
create policy "admin: borrar pedidos"
  on public.pedidos for delete
  using ( public.mi_rol() = 'admin' )


--6. Políticas para pedido_items

-- El cliente ve los ítems de SUS pedidos
create policy "cliente: ver items de sus pedidos"
  on public.pedido_items for select
  using (
    exists (
      select 1 from public.pedidos
      where pedidos.id = pedido_items.pedido_id
        and pedidos.cliente_id = auth.uid()
    )
  );

-- El cliente puede insertar ítems en SUS pedidos
create policy "cliente: insertar items"
  on public.pedido_items for insert
  with check (
    exists (
      select 1 from public.pedidos
      where pedidos.id = pedido_items.pedido_id
        and pedidos.cliente_id = auth.uid()
    )
  );

-- Staff/admin ven y modifican todos los ítems
create policy "staff: ver todos los items"
  on public.pedido_items for select
  using ( public.mi_rol() in ('staff', 'admin') );


--7. Políticas para reservas 

-- Un cliente ve SOLO sus reservas
create policy "cliente: ver sus reservas"
  on public.reservas for select
  using ( cliente_id = auth.uid() );

-- Un cliente puede crear una reserva (el webhook de Stripe la confirmará)
create policy "cliente: crear reserva"
  on public.reservas for insert
  with check (
    cliente_id = auth.uid()
    and public.mi_rol() = 'cliente'
  );

-- Un cliente puede cancelar SU reserva (si el estado es 'pendiente')
create policy "cliente: cancelar reserva pendiente"
  on public.reservas for update
  using (
    cliente_id = auth.uid()
    and estado = 'pendiente'
  )
  with check (
    cliente_id = auth.uid()
    and estado = 'cancelada'   -- solo puede cambiar a 'cancelada', no a 'pagada'
  );

-- Staff/admin ven todas las reservas
create policy "staff: ver todas las reservas"
  on public.reservas for select
  using ( public.mi_rol() in ('staff', 'admin') );

-- Admin gestiona todo
create policy "admin: gestionar reservas"
  on public.reservas for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );

-- 8. El caso del Webhook de Stripe

--El webhook de Stripe actualiza el estado de una reserva (pendiente → pagada). Esta lógica --corre en una Edge Function con la service_role key, que bypasea RLS. Eso es intencional: el --webhook actúa como el sistema, no como un usuario.

--Stripe ──▶ Edge Function (service_role) ──▶ UPDATE reservas SET estado='pagada'
--                                          (RLS ignorado → correcto para esta operación)
--Nunca expongas la service_role key en el cliente. Solo vive en variables de entorno del --servidor.


--9. Verificar que las políticas funcionan

--Usa el SQL Editor de Supabase para simular un usuario concreto:

-- Simula ser el usuario con ese UUID
--set request.jwt.claims = '{"sub":"<UUID-del-cliente>","role":"authenticated"}';

-- Esto debería devolver solo los pedidos de ese usuario
--select * from public.pedidos;

-- Esto debería devolver 0 filas (el cliente no ve pedidos de otros)
--select * from public.pedidos where cliente_id != '<UUID-del-cliente>';