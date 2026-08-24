import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import BrandMark from "@/components/BrandMark";
import BadgeIcon from "@/components/BadgeIcon";
import { DISCORD_INVITE_URL, SITE_NAME } from "@/lib/constants";
import { Clock, Eye, Heart, MapPin, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function MockProfile() {
  return (
    <div className="land-preview">
      <div className="land-preview-label">
        <span>Preview</span>
        <span>{SITE_NAME}/pluto</span>
      </div>
      <article className="profile-card no-banner has-modules" style={{ pointerEvents: "none" }}>
        <div className="profile-body">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar" style={{ borderRadius: "50%", fontSize: 34, color: "#a1a1aa" }}>
              P
            </div>
          </div>
          <h2 className="profile-name">pluto</h2>
          <div className="profile-badges">
            {[
              { id: "verified", name: "Verified", icon: "☑️" },
              { id: "og", name: "OG", icon: "🧍" },
              { id: "donor", name: "Donor", icon: "💰" },
            ].map((badge) => (
              <span key={badge.id} className="profile-badge" title={badge.name}>
                <BadgeIcon badge={badge} monochrome={false} size={16} />
              </span>
            ))}
          </div>
          <div className="profile-meta">
            <span className="profile-handle">@pluto</span>
            <span className="profile-chip">he/him</span>
          </div>
          <p className="profile-bio">Designer. Builder. Mostly offline.</p>
          <p className="profile-location">
            <MapPin size={13} /> Berlin
          </p>
          <div className="profile-tags">
            <span className="profile-tag">design</span>
            <span className="profile-tag">music</span>
            <span className="profile-tag">film</span>
          </div>
          <div className="profile-stats">
            <span className="profile-stat">
              <Eye size={13} /> 2,418
            </span>
            <span className="profile-stat">
              <Heart size={13} /> 186
            </span>
            <span className="profile-stat">Joined Mar 2025</span>
          </div>
        </div>
        <div className="profile-modules">
          <div className="module-card">
            <div style={{ position: "relative", width: 40, height: 40, flex: "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#18181b", border: "1px solid #27272a" }} />
              <span style={{ position: "absolute", right: -1, bottom: -1, width: 12, height: 12, borderRadius: "50%", background: "#22c55e", border: "2px solid #141416" }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="module-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                pluto <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e" }}>online</span>
              </div>
              <div className="module-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MessageCircle size={13} /> Listening to something quiet
              </div>
            </div>
          </div>
          <div className="module-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#09090b", border: "1px solid #27272a", display: "grid", placeItems: "center", flex: "none" }}>
              <Clock size={18} style={{ color: "#a1a1aa" }} />
            </div>
            <div>
              <div className="module-name" style={{ fontVariantNumeric: "tabular-nums" }}>21:04:12</div>
              <div className="module-sub">Local time</div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = "";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    username = profile?.username || "";
  }

  const name = SITE_NAME.split(".")[0];
  const tld = SITE_NAME.includes(".") ? `.${SITE_NAME.split(".").slice(1).join(".")}` : "";

  return (
    <div className="land">
      <SiteHeader signedIn={!!user} username={username} />

      <main className="land-main">
        <section className="land-hero">
          <div>
            <p className="land-kicker">Your page on the internet</p>
            <h1>
              One link.
              <br />
              <span>Everything you are.</span>
            </h1>
            <p>
              {user
                ? "You’re signed in. Jump back into your dashboard and keep shaping the page."
                : "Claim a unique name, then put Discord, music, badges, and links on a page people actually want to open."}
            </p>

            {user ? (
              <div className="land-actions">
                <Link href={username ? "/dashboard" : "/claim"} className="btn-primary">
                  Open dashboard
                </Link>
                <Link href="/marketplace" className="btn-secondary">
                  Marketplace
                </Link>
                {username && (
                  <Link href={`/${username}`} className="btn-secondary">
                    View my page
                  </Link>
                )}
              </div>
            ) : (
              <>
                <form action="/signup" method="get" className="claim-form">
                  <span className="claim-prefix">
                    {name}
                    <span style={{ color: "#55acee" }}>{tld}</span>/
                  </span>
                  <input name="username" placeholder="yourname" autoComplete="off" aria-label="Username" />
                  <button type="submit" className="btn-primary" style={{ height: 36, padding: "0 14px" }}>
                    Claim
                  </button>
                </form>
                <p className="claim-note">
                  Already have one? <Link href="/login">Log in</Link>
                </p>
              </>
            )}
          </div>

          <MockProfile />
        </section>

        <section className="land-points">
          <div className="land-point">
            <b>A name that’s yours</b>
            <span>Every handle is unique. Once you claim it, it stays yours — the kind of URL people remember.</span>
          </div>
          <div className="land-point">
            <b>Discord, live</b>
            <span>Show status, activity, and role badges so the page feels like you, not a link dump.</span>
          </div>
          <div className="land-point">
            <b>Quiet on purpose</b>
            <span>No clutter. A profile that looks good sitting in a Discord bio, a tweet, or a resume.</span>
          </div>
        </section>
      </main>

      <footer className="land-footer">
        <BrandMark />
        <div style={{ display: "flex", gap: 16 }}>
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">
            Discord
          </a>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/login">Log in</Link>
        </div>
      </footer>
    </div>
  );
}
