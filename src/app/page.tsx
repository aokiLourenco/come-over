import { HeroDoor, RevealDemo } from "@/components/Landing";

const FAQ = [
  ["Do my guests need an app or an account?", "No. They tap the link and the invite opens in their browser. It works on any phone or computer, from WhatsApp, iMessage, email or any other chat."],
  ["How do I see who's coming?", "When you create an invite, you get a private guest list page. It shows who's going, who's a maybe, who can't make it, how many people they're bringing and how many times the invite has been opened."],
  ["Can I keep my address private?", "Yes. Turn on the address option and guests see it only after they say they're coming, on the invite and in their calendar file."],
  ["What if the plans change?", "Open your private page and edit the invite. Everyone with the link sees the new details straight away, and their RSVPs stay in place."],
  ["Does it cost anything?", "No. Making, sending and opening invites is free, with no signup for you or your guests."],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <nav className="hero-nav">
          <a className="wordmark" href="/">Come Over</a>
          <a className="hero-nav-link" href="/create">Make an invite</a>
        </nav>
        <div className="hero-copy">
          <h1>Come over.</h1>
          <p>
            A party invite your guests open by hand. They knock on a door, smash a piñata or pull a popper, then
            RSVP in one tap. You send one link and watch the guest list fill up.
          </p>
          <a className="btn-main btn-big" href="/create">Make an invite</a>
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
          <li><strong>Add the details.</strong> When, where, what to wear, a photo and a line or two from you.</li>
          <li><strong>Send one link.</strong> Drop it in the group chat. Replies land on your private guest list.</li>
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
        <a href="/create">Make an invite</a>
      </footer>
    </>
  );
}
