-- Esegui DOPO aver creato l'utente admin@kickoff.local
-- da Authentication > Users > Add user (spunta "Auto Confirm User")
insert into public.profili (id, username, nome_visualizzato, ruolo)
select id, 'admin', 'Mattia', 'admin'
from auth.users
where email = 'admin@kickoff.local';
