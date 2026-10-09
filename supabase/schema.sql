-- =====================================================
-- KickOff Crediti Maestri: schema completo
-- Incolla tutto nel SQL Editor di Supabase e premi Run
-- =====================================================

create type public.ruolo as enum ('admin', 'segreteria', 'maestro');

create table public.maestri (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cognome text not null,
  telefono text,
  note text,
  attivo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profili (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  nome_visualizzato text not null,
  ruolo public.ruolo not null,
  maestro_id uuid references public.maestri(id) on delete set null,
  attivo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.campi (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  ambiente text not null check (ambiente in ('interno', 'esterno')),
  ordine int not null default 0
);

-- Tariffe orarie per copertura e fascia ('24:00' = mezzanotte)
create table public.tariffe (
  id uuid primary key default gen_random_uuid(),
  ambiente text not null check (ambiente in ('interno', 'esterno')),
  fascia text not null,
  dalle time not null,
  alle time not null,
  prezzo_orario numeric(10,2) not null default 0 check (prezzo_orario >= 0),
  ordine int not null default 0,
  constraint fascia_valida check (alle > dalle)
);
insert into public.tariffe (ambiente, fascia, dalle, alle, prezzo_orario, ordine) values
  ('interno', 'Mattina',    '08:00', '15:00',  8, 1),
  ('interno', 'Pomeriggio', '15:00', '24:00', 10, 2),
  ('esterno', 'Mattina',    '08:00', '15:00',  4, 3),
  ('esterno', 'Pomeriggio', '15:00', '24:00',  5, 4);

insert into public.campi (numero, ambiente, ordine) values
  ('1', 'interno', 1),
  ('2', 'interno', 2),
  ('Centrale', 'interno', 3),
  ('3', 'esterno', 4),
  ('4', 'esterno', 5);

create table public.movimenti (
  id uuid primary key default gen_random_uuid(),
  maestro_id uuid not null references public.maestri(id) on delete restrict,
  tipo text not null check (tipo in ('addebito', 'ricarica')),
  importo numeric(10,2) not null check (importo > 0),
  data date not null default ((now() at time zone 'Europe/Rome')::date),
  campo text,
  ambiente text check (ambiente in ('interno', 'esterno')),
  ora_inizio time,
  ora_fine time,
  metodo text,
  note text,
  creato_da uuid references public.profili(id) on delete set null,
  creato_il timestamptz not null default now(),
  modificato_da uuid references public.profili(id) on delete set null,
  modificato_il timestamptz,
  constraint addebito_completo check (
    tipo = 'ricarica' or (campo is not null and ambiente is not null and ora_inizio is not null)
  )
);
create index movimenti_maestro_data on public.movimenti (maestro_id, data desc);
create index movimenti_data on public.movimenti (data desc);

-- Traccia chi modifica un movimento
create or replace function public.tocca_modifica() returns trigger
language plpgsql as $$
begin
  new.modificato_il := now();
  new.modificato_da := auth.uid();
  return new;
end $$;

create trigger movimenti_modifica
  before update on public.movimenti
  for each row execute function public.tocca_modifica();

-- Funzioni di supporto per i permessi
create or replace function public.mio_ruolo() returns public.ruolo
language sql stable security definer set search_path = public as $$
  select ruolo from public.profili where id = auth.uid() and attivo
$$;

create or replace function public.mio_maestro() returns uuid
language sql stable security definer set search_path = public as $$
  select maestro_id from public.profili where id = auth.uid() and attivo
$$;

-- Saldi calcolati (rispettano i permessi di chi interroga)
create view public.saldi with (security_invoker = true) as
select
  m.id as maestro_id,
  m.nome,
  m.cognome,
  m.attivo,
  coalesce(sum(case when mv.tipo = 'ricarica' then mv.importo else -mv.importo end), 0)::numeric(10,2) as saldo,
  max(mv.data) as ultimo_movimento
from public.maestri m
left join public.movimenti mv on mv.maestro_id = m.id
group by m.id;

-- Row Level Security
alter table public.maestri enable row level security;
alter table public.profili enable row level security;
alter table public.campi enable row level security;
alter table public.tariffe enable row level security;
alter table public.movimenti enable row level security;

create policy maestri_lettura on public.maestri for select to authenticated
  using (public.mio_ruolo() in ('admin', 'segreteria') or id = public.mio_maestro());
create policy maestri_admin on public.maestri for all to authenticated
  using (public.mio_ruolo() = 'admin') with check (public.mio_ruolo() = 'admin');

create policy profili_lettura on public.profili for select to authenticated
  using (id = auth.uid() or public.mio_ruolo() = 'admin');
create policy profili_admin on public.profili for all to authenticated
  using (public.mio_ruolo() = 'admin') with check (public.mio_ruolo() = 'admin');

create policy campi_lettura on public.campi for select to authenticated using (true);
create policy campi_admin on public.campi for all to authenticated
  using (public.mio_ruolo() = 'admin') with check (public.mio_ruolo() = 'admin');

create policy tariffe_lettura on public.tariffe for select to authenticated using (true);
create policy tariffe_admin on public.tariffe for all to authenticated
  using (public.mio_ruolo() = 'admin') with check (public.mio_ruolo() = 'admin');

create policy movimenti_lettura on public.movimenti for select to authenticated
  using (public.mio_ruolo() in ('admin', 'segreteria') or maestro_id = public.mio_maestro());
create policy movimenti_inserimento on public.movimenti for insert to authenticated
  with check (public.mio_ruolo() in ('admin', 'segreteria') and creato_da = auth.uid());
create policy movimenti_modifica on public.movimenti for update to authenticated
  using (public.mio_ruolo() = 'admin') with check (public.mio_ruolo() = 'admin');
create policy movimenti_cancellazione on public.movimenti for delete to authenticated
  using (public.mio_ruolo() = 'admin');

-- ================= Registro operazioni =================
-- La segreteria può leggere i nomi degli operatori (non i maestri)
drop policy if exists profili_staff on public.profili;
create policy profili_staff on public.profili for select to authenticated
  using (public.mio_ruolo() in ('admin', 'segreteria'));

-- Campi "tecnici" che non contano come modifica di un'operazione
create or replace function public.cambio_reale(vecchio public.movimenti, nuovo public.movimenti) returns boolean
language sql immutable as $$
  select (to_jsonb(vecchio) - array['creato_da', 'modificato_da', 'modificato_il'])
      is distinct from (to_jsonb(nuovo) - array['creato_da', 'modificato_da', 'modificato_il'])
$$;

create or replace function public.tocca_modifica() returns trigger
language plpgsql as $$
begin
  if public.cambio_reale(old, new) then
    new.modificato_il := now();
    new.modificato_da := auth.uid();
  end if;
  return new;
end $$;

-- Registro di tutto ciò che succede alle operazioni
create table if not exists public.registro (
  id bigint generated always as identity primary key,
  movimento_id uuid not null,
  maestro_id uuid,
  azione text not null check (azione in ('creazione', 'modifica', 'eliminazione')),
  utente_id uuid references public.profili(id) on delete set null,
  utente_nome text,
  quando timestamptz not null default now(),
  prima jsonb,
  dopo jsonb
);
create index if not exists registro_quando on public.registro (quando desc);
create index if not exists registro_movimento on public.registro (movimento_id);
create index if not exists registro_utente on public.registro (utente_id);

create or replace function public.registra_evento() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_nome text;
begin
  select id, nome_visualizzato into v_id, v_nome from public.profili where id = auth.uid();
  if tg_op = 'INSERT' then
    insert into public.registro (movimento_id, maestro_id, azione, utente_id, utente_nome, dopo)
    values (new.id, new.maestro_id, 'creazione', v_id, v_nome, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    if public.cambio_reale(old, new) then
      insert into public.registro (movimento_id, maestro_id, azione, utente_id, utente_nome, prima, dopo)
      values (new.id, new.maestro_id, 'modifica', v_id, v_nome, to_jsonb(old), to_jsonb(new));
    end if;
    return new;
  else
    insert into public.registro (movimento_id, maestro_id, azione, utente_id, utente_nome, prima)
    values (old.id, old.maestro_id, 'eliminazione', v_id, v_nome, to_jsonb(old));
    return old;
  end if;
end $$;

drop trigger if exists movimenti_registro on public.movimenti;
create trigger movimenti_registro
  after insert or update or delete on public.movimenti
  for each row execute function public.registra_evento();

alter table public.registro enable row level security;
drop policy if exists registro_lettura on public.registro;
create policy registro_lettura on public.registro for select to authenticated
  using (public.mio_ruolo() = 'admin');
