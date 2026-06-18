# Capper WebUI

Dark enterprise control plane console for Capper — a lightweight private cloud / capsule runtime.

## Development

Terminal 1 — start the Capper API:

```bash
cd ../Capper
go run ./cmd/capper api start --listen 127.0.0.1:8686 --with-daemon
```

Terminal 2 — start the Vite dev server (proxies `/api/v1` to the API):

```bash
npm install
npm run dev
```

Open <http://localhost:5173>

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_CAPPER_API_URL` | `/api/v1` | API base URL |
| `VITE_FACTORY_URL` | `http://127.0.0.1:8080` | External CapsuleBuilder factory webui |
| `VITE_MARKETPLACE_ENABLED` | `false` | Enable marketplace nav + pages |

## Production

Build static assets:

```bash
npm run build
```

Serve from Capper API:

```bash
capper api start --listen 0.0.0.0:8686 --console ./dist
```

## Stack

Vite, React, TypeScript, React Router, TanStack Query, Tailwind CSS, Lucide, Monaco Editor, xterm.js, Recharts.

## License

[MIT](LICENSE)
