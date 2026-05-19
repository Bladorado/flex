create extension IF not exists btree_gist;

create table usuarios (
  id serial primary key,
  nombre text not null,
  email text not null unique,
  nivel text not null default 'principiante' check (
    nivel in ('principiante', 'intermedio', 'avanzado')
  ),
  creado_en timestamptz not null default now()
);

create table pistas (
  id serial primary key,
  tipo text not null default 'cubierta' check (tipo in ('cubierta', 'exterior')),
  numero int NOT NULL UNIQUE,
  creado_en timestamptz not null default now()
);

create table reservas (
  id serial primary key,
  usuario_id int not null references usuarios(id) on delete CASCADE,
  pista_id int not null references pistas(id) on delete CASCADE,
  estado text not null default 'confirmada' check (estado in ('confirmada', 'cancelada')),
  inicio timestamptz not null,
  fin timestamptz not null,
  creado_en timestamptz not null default now(),

  constraint sin_solapamiento exclude using gist (
    pista_id WITH =,
    tstzrange(inicio, fin) WITH && 
  ) WHERE (estado != 'cancelada')
);

create table notificaciones (
  id serial primary key,
  usuario_id int REFERENCES usuarios(id) ON DELETE CASCADE,
  reserva_id int not null references reservas (id) on delete CASCADE,
  mensaje text not null default 'Reserva creada con éxito',
  creado_en timestamptz not null default now()
);

CREATE OR REPLACE FUNCTION notificar_reserva()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notificaciones (reserva_id, usuario_id,mensaje)
  VALUES (NEW.id, NEW.usuario_id 'Reserva creada con éxito');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notificar_reserva
  AFTER INSERT          -- cuándo: BEFORE o AFTER el evento
  ON reservas       -- en qué tabla
  FOR EACH ROW          -- para cada fila afectada
  EXECUTE FUNCTION notificar_reserva();