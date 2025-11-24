# Glucodiary

Web app minimale per diario del glucosio, pensata per persone con diabete e per i medici che le seguono.

- Registrazione / login con email + password (Supabase Auth)
- Diario giornaliero a fasce orarie
- Valore glicemico, carboidrati, insulina, tag, note
- Condivisione dati con il medico (lettura)
- Modalità medico per consultare i pazienti che hanno condiviso i dati

---

## 1. Requisiti

- Node.js (>= 18)
- Account Supabase
- SQL già eseguito su Supabase per tabelle e policy (glucose_entries, shares, RLS)

---

## 2. Configurazione Supabase

Nel progetto Supabase:

1. Vai su **Project Settings → API** e copia:
   - `Project URL`
   - `anon public key`

2. Esegui nel **SQL Editor** lo script che crea tabelle e policy (già fornito a parte).

---

## 3. Setup locale

Clona il repo e installa le dipendenze:

```bash
npm install
```

Crea un file `.env` nella root del progetto (puoi copiare `.env.example`):

```env
VITE_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
VITE_SUPABASE_ANON_KEY=LA_TUA_ANON_KEY
```

Avvia in sviluppo:

```bash
npm run dev
```

Apri l'URL mostrato in console (es. `http://localhost:5173`).

---

## 4. Pubblicazione su GitHub

1. Crea un nuovo repository su GitHub (es. `glucodiary`).
2. In locale, inizializza git se non l'hai già fatto:

   ```bash
   git init
   git add .
   git commit -m "Initial commit Glucodiary"
   git branch -M main
   git remote add origin https://github.com/TUO-USERNAME/TUO-REPO.git
   git push -u origin main
   ```

3. Verifica su GitHub che **NON** ci sia il file `.env` (è escluso da `.gitignore`).

---

## 5. Deploy su Vercel

1. Vai su [https://vercel.com](https://vercel.com) e collegati con GitHub.
2. Clicca **Add New → Project** e seleziona il repository `glucodiary`.
3. Vercel rileverà automaticamente:
   - Framework: **Vite + React**
   - Comando build: `vite build`
   - Output: `dist`

4. Nella sezione **Environment Variables** aggiungi:

   - `VITE_SUPABASE_URL` = `https://TUO-PROGETTO.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = la tua anon key Supabase

5. Clicca **Deploy**.

Al termine Vercel ti darà un URL pubblico (es. `https://glucodiary.vercel.app`) dove potrai usare l'app da qualsiasi dispositivo.

---

## 6. Note

- Le chiavi Supabase NON vanno mai committate nel repo (`.env` è nel `.gitignore`).
- Per cambiare progetto Supabase basta cambiare le variabili nel `.env` locale e nelle environment variables di Vercel.
