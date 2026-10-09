# KickOff Crediti

Credito prepagato dei maestri per l'uso dei campi.

- **Segreteria**: scala credito (campo, interno/esterno, orario, quota) e carica le ricariche.
- **Maestri**: vedono credito residuo e storico.
- **Admin**: maestri, utenze, modifica/eliminazione operazioni, campi e tariffe.

## Messa online

### 1. Supabase
1. Crea un nuovo progetto.
2. **SQL Editor**: incolla tutto `supabase/schema.sql` e premi **Run** (crea anche campi e tariffe).
   Se avevi già creato il database con una versione precedente, esegui solo gli `aggiornamento-XX` che non hai ancora lanciato, in ordine.
3. **Authentication > Users > Add user > Create new user**
   - Email: `admin@kickoff.local`
   - Password: a tua scelta
   - Spunta **Auto Confirm User**
4. **SQL Editor**: incolla ed esegui `supabase/primo-admin.sql`.
5. Da **Project Settings > API** copia: Project URL, chiave anon (o publishable) e chiave service_role (o secret).

### 2. GitHub
Nuovo repository, trascina dentro il contenuto di questa cartella.

### 3. Vercel
Importa il repository e aggiungi le variabili:

| Nome | Valore |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chiave anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | chiave service_role / secret (mai pubblica) |

Deploy, poi entra con username **admin**.

### 4. Primo giro
1. **Campi e tariffe**: campi e prezzi sono già caricati, controllali.
2. **Maestri**: aggiungi i maestri (con username e password se devono vedere il saldo).
3. **Utenze**: crea l'utenza della segreteria.

## Note
- Le utenze usano solo lo username: internamente diventa `username@kickoff.local`, nessuna email viene inviata.
- Il saldo può andare in negativo: la segreteria vede un avviso prima di confermare.
- Solo l'admin può modificare o eliminare operazioni.
- Ogni creazione, modifica ed eliminazione finisce nel **Registro** (solo admin) con operatore, ora e valori prima/dopo.
- I maestri disattivati spariscono dalla cassa ma il loro storico resta.
