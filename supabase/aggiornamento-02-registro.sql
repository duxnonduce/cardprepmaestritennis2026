-- Esegui questo se hai già creato il database con le versioni precedenti.
-- Aggiunge il registro di chi crea, modifica ed elimina le operazioni.

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

-- Riporta nel registro le operazioni già esistenti
insert into public.registro (movimento_id, maestro_id, azione, utente_id, utente_nome, quando, dopo)
select mv.id, mv.maestro_id, 'creazione', mv.creato_da, p.nome_visualizzato, mv.creato_il, to_jsonb(mv)
from public.movimenti mv
left join public.profili p on p.id = mv.creato_da
where not exists (select 1 from public.registro r where r.movimento_id = mv.id);
