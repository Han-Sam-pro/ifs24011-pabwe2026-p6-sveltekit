# ifs24035-pabwe2026-sk-p6-svelte

Delcom Link Tree — Studi Kasus 1 Praktikum 6 PABWE (Svelte 5, Vite, JavaScript).

## Prasyarat

- [Bun](https://bun.com)
- File `.env` (salin dari `.env.example`):

```env
VITE_DELCOM_BASEURL=https://open-api.delcom.org/api/v1
APP_PORT=3004
```

## Menjalankan

```bash
bun install
bun run dev        # pengembangan di http://localhost:3004
bun run build      # build produksi
bun run preview    # jalankan hasil build di http://localhost:3004
```

## Pengujian

```bash
bun run test            # jalankan seluruh pengujian
bun run test:coverage   # pengujian + laporan coverage (threshold 100%)
```
