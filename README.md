# Come Over

Party invites your guests open by hand. Pick a party and a reveal, add the details, and send
one link. Guests knock on a door or smash a piñata, then RSVP. No app or account for anyone.

![The six reveals](docs/reveals.png)

## Run it

Needs Node 22.13 or newer.

```sh
npm install
npm run dev        # http://localhost:3000
```

```sh
npm test           # validation, address privacy, RSVP rules, calendar output
npm run typecheck
npm run build && npm start
```

Invites are stored in SQLite at `data/come-over.db`. Set `DATABASE_PATH` to move it.

## How it works

| Page | What it does |
| --- | --- |
| `/` | Landing page with a live door and a demo of every reveal |
| `/create` | Four steps: occasion, reveal, details, preview |
| `/i/:id` | The guest's invite. `?to=Sam` greets them by name |
| `/m/:token` | The host's private guest list, share links, edit and delete |

- There are no accounts. The host's secret is the `/m/:token` URL, and each guest gets an
  httpOnly cookie that lets them change their own RSVP.
- Guest-facing data is built in one place, `toPublicInvite()` in `src/lib/store.ts`. A hidden
  address stays out of it until that guest has said yes. Pages, the RSVP response and the
  calendar file all go through it.
- Party times are wall-clock at the venue and are never converted to the viewer's time zone.
- Reveals live in `src/components/reveals/`. Each is drawn on a fixed 390 x 780 board that
  scales to its container. To add one, write a scene, register it in `RevealStage.tsx` and add
  it to `REVEALS` in `src/lib/config.ts`.
- All sound is synthesized in `src/lib/sound.ts`, so there are no audio files.

## Before you put it online

- It needs a server with a persistent disk (Fly.io, Railway, a VPS). Vercel's serverless
  functions won't keep the SQLite file. To host there, reimplement `src/lib/store.ts` on Postgres.
- Serve it over HTTPS. The guest cookie is `Secure` in production.
- The rate limiter in `src/lib/rate-limit.ts` is per process and trusts `X-Forwarded-For`, so
  run it behind a proxy that sets that header.
- Invites and photos are kept until the host deletes them. There's no cleanup job yet.
