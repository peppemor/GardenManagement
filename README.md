<<<<<<< HEAD
# Vivaio Gestionale

Gestionale full-stack per vivaio con ruoli `admin` e `operatore`.

## Struttura

- `server/`: API Express, SQLite, JWT
- `client/`: React + Vite
- `package.json` root: script per avvio contemporaneo

## Prerequisiti

- Node.js 18+

## Setup rapido

1. Copia `server/.env.example` in `server/.env`
2. Installa dipendenze:
   - `npm install`
   - `npm install --prefix server`
   - `npm install --prefix client`
3. Avvia in sviluppo: `npm run dev`

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

## Login iniziale

L'admin di default viene creato automaticamente al primo avvio:

- username: `admin`
- password: `admin123`

(Consigliato cambiare credenziali tramite variabili ambiente.)

## API principali

- `POST /api/auth/login`
- `GET/POST/PUT/DELETE /api/clienti`
- `GET/POST/PUT/DELETE /api/template`
- `GET/POST/PUT/DELETE /api/operatori`
- `GET/POST /api/rapporti`

## Note

- Gli operatori vedono solo i clienti assegnati e i relativi rapporti.
- `NuovoRapporto` e form operatore sono mobile-first.
=======
# Vivaio
Gestionale per vivaio
>>>>>>> ccbb7889604918feab4af3d0b97f415ed2154fc1
