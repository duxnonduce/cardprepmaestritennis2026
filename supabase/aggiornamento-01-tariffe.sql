-- Solo se hai GIÀ eseguito la prima versione di schema.sql.
-- Sostituisce le tariffe con quelle a fasce e precarica i campi.

drop table if exists public.tariffe;

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

alter table public.tariffe enable row level security;
create policy tariffe_lettura on public.tariffe for select to authenticated using (true);
create policy tariffe_admin on public.tariffe for all to authenticated
  using (public.mio_ruolo() = 'admin') with check (public.mio_ruolo() = 'admin');

insert into public.campi (numero, ambiente, ordine) values
  ('1', 'interno', 1),
  ('2', 'interno', 2),
  ('Centrale', 'interno', 3),
  ('3', 'esterno', 4),
  ('4', 'esterno', 5)
on conflict (numero) do update set ambiente = excluded.ambiente, ordine = excluded.ordine;
