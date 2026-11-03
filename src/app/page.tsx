import Link from "next/link";
import { HeroDoor, RevealDemo } from "@/components/Landing";

const FAQ = [
  ["Do my guests need an app or an account?", "No. They tap the link, type the door code and the invite opens in their browser. It works on any phone or computer, from WhatsApp, iMessage, email or any other chat."],
  ["What's the door code for?", "Every invite is locked with a 4-digit code that you choose. Send it to your guests separately, so a forwarded link can't be opened on its own. It keeps out curious strangers, but don't put anything truly secret in an invite."],
  ["How do I see who's coming?", "Guests pick their answer and it opens as a message to you on WhatsApp, text or email. There's no shared guest list, so your replies live in those chats."],
  ["Can I write it in Portuguese?", "Yes. Switch to Português when you create the invite and your guests see the whole thing in Portuguese, from the door code to the RSVP."],
  ["What if the plans change?", "Edit the invite to get a new link and send that one. Links you already sent keep the old details."],
  ["Where are invites stored?", "Nowhere online. The invite is encrypted inside the link itself, so keep a copy of the link."],
  ["Does it cost anything?", "No. Making, sending and opening invites is free, with no signup for you or your guests."],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <nav className="hero-nav">
          <Link className="wordmark" href="/">Come Over</Link>
          <span className="hero-nav-links">
            <Link className="hero-nav-link" href="/create/?lang=pt" lang="pt-BR">Criar em português</Link>
            <Link className="hero-nav-link" href="/create/?lang=en">Make an invite</Link>
          </span>
        </nav>
        <div className="hero-copy">
          <h1>Come over.</h1>
          <p>
            A party invite your guests open by hand. They type your door code, then knock on a door, smash a
            piñata or pull a popper. Their RSVP lands straight in your messages.
          </p>
          <Link className="btn-main btn-big" href="/create/">Make an invite</Link>
        </div>
        <HeroDoor />
        <div className="hero-floor" aria-hidden="true" />
      </section>

      <section className="band band-ink">
        <RevealDemo />
      </section>

      <section className="band band-pink">
        <h2 className="band-title">Three steps to a full house</h2>
        <ol className="how">
          <li><strong>Pick a party and a reveal.</strong> Birthday, dinner, game night. Then choose how it opens.</li>
          <li><strong>Add the details.</strong> When, where, what to wear, and a door code only your guests get.</li>
          <li><strong>Send the link and the code.</strong> Replies come to you on WhatsApp, text or email.</li>
        </ol>
      </section>

      <section className="band band-paper">
        <h2 className="band-title">Questions people ask</h2>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="site-foot">
        <span className="wordmark">Come Over</span>
        <Link href="/create/">Make an invite</Link>
      </footer>
    </>
  );
}
