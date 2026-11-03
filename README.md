# Come Over

Party invites your guests open by hand. Pick a party and a reveal, add the details, and send
a link and a 4-digit door code. Guests type the code, knock on a door or smash a piñata, then
reply on WhatsApp, text or email. No app or account for anyone. Available in English and
Portuguese.

**Live site:** https://aokilourenco.github.io/come-over/

![The six reveals](docs/reveals.png)

## Run it

Needs Node 22.13 or newer.

```sh
npm install
npm run dev        # http://localhost:3000
npm test           # door codes, encryption, validation, translations, calendar output
npm run typecheck
```

## Publish it

```sh
npm run deploy     # builds the site and pushes it to the gh-pages branch
```

The site path comes from the `origin` repo name.

## How it works

The site is fully static, so GitHub Pages only serves empty pages and scripts.

- **The invite lives in the link.** `src/lib/seal.ts` compresses it and encrypts it with
  AES-GCM, using a key derived from the door code. It sits in the URL fragment, which browsers
  don't send to servers. Nothing about a party is ever stored online.
- **Door code.** The wrong code fails to decrypt, so the guest never gets the details.
  Decrypted data is validated like form input, because anyone can craft a link.
- **RSVPs** open as a prefilled WhatsApp, text or email message to the host. If the host gave
  no contact details, the guest copies their reply instead.
- **Language** is chosen in the wizard and stored with the invite. All text is in
  `src/lib/i18n.ts`, and the types require every English string to have a Portuguese one.
- **Reveals** live in `src/components/reveals/`. To add one, write a scene on the 390 x 780
  board, register it in `RevealStage.tsx` and add it to `REVEALS` in `src/lib/config.ts`.

## Limits of this version

- **The door code stops casual snooping, not a determined attacker.** A static site can't limit
  attempts, so someone with the link could try all 10,000 codes on their own computer. Don't
  put anything in an invite that would be harmful if it got out.
- **No shared guest list, open counts or photos.** They need a server, and photos don't fit in a link.
- **Replies aren't confirmed.** An RSVP only reaches the host if the guest presses send in the
  messaging app.
- **Edits make a new link.** Links already sent keep the old details.
- **Link previews are generic**, because the page can't see the invite.

The `server-version` branch has the earlier Next.js and SQLite build, with a live guest list,
photos and an address that stays hidden until a guest says yes. It needs a host with a
persistent disk, such as Fly.io, Railway or a VPS.
