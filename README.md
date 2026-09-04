# Signal | Smart Market Watchlist

Signal is a MERN watchlist designed to answer the question: **what meaningfully changed since I last checked?** It classifies movement using price change and volume context instead of presenting a noisy quote grid.

## Stack

- React 19 + Vite + Lucide
- Node.js + Express
- MongoDB + Mongoose
- Axios is included for the market-data provider integration

## Run locally

1. Start MongoDB locally, or provide a hosted connection string in `server/.env`.
2. Start the API:

```powershell
cd server
npm install
npm run dev
```

3. In another terminal, start the client:

```powershell
cd client
npm install
npm run dev
```

The client is available at the Vite URL shown in the terminal. The API runs on `http://localhost:5000`.

Create `server/.env` from this example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/signal
```

## Thunder Client checks

Use `http://localhost:5000` as the request base URL.

- `GET /api/health`
- `GET /api/market/quotes?symbols=NVDA,AAPL,TCS`
- `GET /api/watchlist`
- `POST /api/watchlist` with JSON `{ "symbol": "NVDA" }`
- `DELETE /api/watchlist/NVDA`

The market route currently uses deterministic demo data. The adapter boundary is deliberately isolated so a production provider can be added without changing the watchlist or UI contract. Quotes are marked delayed, and the UI exposes freshness instead of pretending market data is real-time.

## Submission and commits

Yes: submit the **GitHub repository link** in the HackerEarth submission form, along with any required demo URL or video fields. Make the repository public if judges need direct access, and include a clear README, screenshots, setup steps, and a short architecture explanation.

A clean commit sequence is useful for reviewer confidence, but commit frequency does not earn selection by itself. Commit at these meaningful checkpoints:

1. `chore: scaffold MERN workspace`
2. `feat: add watchlist API and market signal classifier`
3. `feat: build meaningful changes dashboard`
4. `test: verify API and client build`
5. `docs: add submission and architecture guide`

Push after each checkpoint. Before submitting, verify a fresh clone can run the README commands and remove secrets from Git history.
