-- Escenario activo de la demo "asesoría con IA" (generado por chat).
-- Una sola fila con id 'activo'; si no existe, la demo usa el escenario por defecto.
create table if not exists demo_escenario (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table demo_escenario enable row level security;
-- Sin políticas: solo accesible con service role key desde el servidor.
