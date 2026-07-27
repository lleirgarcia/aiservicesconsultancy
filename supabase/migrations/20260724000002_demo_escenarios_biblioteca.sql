-- Biblioteca de escenarios de la demo "asesoría con IA".
-- Cada fila es un escenario guardado con su bandeja procesada; como mucho
-- una fila tiene activo = true (índice parcial único).
create table if not exists demo_escenarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  data jsonb not null,
  bandeja jsonb,
  activo boolean not null default false,
  updated_at timestamptz not null default now()
);

create unique index if not exists demo_escenarios_activo_unico
  on demo_escenarios (activo) where activo;

alter table demo_escenarios enable row level security;
-- Sin políticas: solo accesible con service role key desde el servidor.

-- Migra el escenario activo de la tabla antigua de fila única.
insert into demo_escenarios (nombre, data, activo)
select coalesce(data->>'nombre', 'Escenario'), data, true
from demo_escenario
where id = 'activo';

drop table if exists demo_escenario;
