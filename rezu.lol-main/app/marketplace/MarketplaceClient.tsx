"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isPremiumUsername, MARKETPLACE_PRICES, DISCORD_ROLE_BADGES, SITE_NAME } from "@/lib/constants";
import { purchaseUsername, purchaseBadge } from "./actions";
import BadgeIcon from "@/components/BadgeIcon";
import BrandMark from "@/components/BrandMark";

type BadgeItem = { id: string; name: string; icon: string };

export default function MarketplaceClient({
  userId,
  discordId,
  myUsernames,
  myBadges,
  availableBadges,
}: {
  userId: string | null;
  discordId: string | null;
  myUsernames: string[];
  myBadges: string[];
  availableBadges: BadgeItem[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [discordRoles, setDiscordRoles] = useState<string[]>([]);
  useEffect(() => {
    if (!discordId) return;
    let alive = true;
    async function loadRoles() {
      try {
        const res = await fetch(`/api/discord/presence/${discordId}`);
        const data = await res.json();
        if (!alive) return;
        const roleIds = Array.isArray(data?.member?.roles) ? data.member.roles : Array.isArray(data?.roles) ? data.roles : [];
        setDiscordRoles(roleIds.map(String));
      } catch {}
    }
    loadRoles();
    return () => { alive = false; };
  }, [discordId]);

  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState<"idle" | "checking" | "available" | "taken" | "purchased" | "not_premium">("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkUsername = async (name: string) => {
    setError("");
    const clean = name.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    setSearchName(clean);

    if (!clean) {
      setSearchStatus("idle");
      return;
    }

    if (!isPremiumUsername(clean)) {
      setSearchStatus("not_premium");
      return;
    }

    setSearchStatus("checking");

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${clean},alias.eq.${clean}`)
      .maybeSingle();

    if (profile) {
      setSearchStatus("taken");
      return;
    }

    const { data: purchase } = await supabase
      .from("purchased_usernames")
      .select("id")
      .eq("username", clean)
      .maybeSingle();

    if (purchase) {
      setSearchStatus("purchased");
    } else {
      setSearchStatus("available");
    }
  };

  const handleBuyUsername = async () => {
    if (!userId) {
      router.push("/login?next=/marketplace");
      return;
    }
    if (searchStatus !== "available" || !searchName) return;
    setLoading(true);
    setError("");

    const res = await purchaseUsername(searchName);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      alert(`Successfully purchased @${searchName}! You can now set it as your handle in the dashboard.`);
      setSearchName("");
      setSearchStatus("idle");
      router.refresh();
    }
  };

  const handleBuyBadge = async (badgeId: string, badgeName: string) => {
    if (!userId) {
      router.push("/login?next=/marketplace");
      return;
    }
    if (confirm(`Confirm purchase of the "${badgeName}" badge for $${MARKETPLACE_PRICES[badgeId]?.toFixed(2)}?`)) {
      const res = await purchaseBadge(badgeId);
      if (res.error) {
        alert(res.error);
      } else {
        alert(`Successfully purchased the "${badgeName}" badge! You can enable it in your dashboard.`);
        router.refresh();
      }
    }
  };

  const getUsernamePrice = () => {
    const len = searchName.length;
    if (len === 1) return MARKETPLACE_PRICES.username_1_letter;
    if (len === 2) return MARKETPLACE_PRICES.username_2_letter;
    if (len === 3) return MARKETPLACE_PRICES.username_3_letter;
    return 0;
  };

  const descriptions: Record<string, string> = {
    rich: "For contributors and supporters.",
    og: "Early registration. You were here first.",
    donor: "Unlocked by funding the server.",
    premium: "Premium platform status.",
    verified: "Account authenticity.",
    winner: "Top community standing.",
    early: "You believed in this early.",
    bug: `Found issues. Helped secure ${SITE_NAME}.`,
    helper: "Awarded to people who help.",
    staff: "Official platform team.",
    owner: "Core administration.",
  };

  return (
    <main className="mp-shell">
      <div className="mp-wrap">
        <header className="mp-head">
          <button className="btn-ghost" onClick={() => router.push(userId ? "/dashboard" : "/")} style={{ padding: 0, height: "auto" }}>
            <ArrowLeft size={14} /> {userId ? "Dashboard" : "Home"}
          </button>
          <BrandMark />
        </header>

        <div className="mp-grid">
          <div>
            <h1 className="mp-title">Marketplace</h1>
            <p className="mp-lead">
              Short handles and badges that sit on your profile. Buy once, keep them.
            </p>

            <section className="mp-section">
              <h2>Premium handles</h2>
              <p>1-letter, 2-letter, and select 3-letter names are reserved. Check one and take it if it’s free.</p>

              <div style={{ display: "flex", gap: 10, alignItems: "stretch", maxWidth: 480 }}>
                <div className="auth-handle" style={{ flex: 1 }}>
                  <span className="auth-handle-prefix">{SITE_NAME}/</span>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => checkUsername(e.target.value)}
                    placeholder="ab"
                  />
                  <span className="auth-handle-status">
                    {searchStatus === "checking" && <Loader2 size={15} className="spin" style={{ color: "#71717a" }} />}
                    {searchStatus === "available" && <Check size={15} style={{ color: "#10b981" }} />}
                    {(searchStatus === "taken" || searchStatus === "purchased" || searchStatus === "not_premium") && <X size={15} style={{ color: "#ef4444" }} />}
                  </span>
                </div>
                {searchStatus === "available" && (
                  <button className="btn-primary" onClick={handleBuyUsername} disabled={loading} style={{ height: 42 }}>
                    {loading ? <Loader2 size={13} className="spin" /> : "Acquire"}
                  </button>
                )}
              </div>

              <div style={{ minHeight: 20, fontSize: 13, marginTop: 10 }}>
                {searchStatus === "available" && (
                  <span style={{ color: "#10b981" }}>
                    Available — ${getUsernamePrice()?.toFixed(2)}
                  </span>
                )}
                {searchStatus === "taken" && <span style={{ color: "#ef4444" }}>Already claimed.</span>}
                {searchStatus === "purchased" && <span style={{ color: "#ef4444" }}>Already purchased.</span>}
                {searchStatus === "not_premium" && <span style={{ color: "#71717a" }}>Not a restricted handle. Claim it for free from the dashboard.</span>}
                {error && <span style={{ color: "#ef4444" }}>{error}</span>}
              </div>
            </section>

            <section className="mp-section">
              <h2>Profile badges</h2>
              <p>Small marks that sit under your name. People notice them.</p>

              <div className="mp-badges">
                {availableBadges.map((badge) => {
                  const roleBadge = DISCORD_ROLE_BADGES.find((dr) => dr.id === badge.id);
                  const earnedViaDiscord = roleBadge ? discordRoles.includes(roleBadge.roleId) : false;
                  const owned = myBadges.includes(badge.id) || earnedViaDiscord;
                  const price = MARKETPLACE_PRICES[badge.id] || 0;

                  return (
                    <div key={badge.id} className="mp-badge">
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                          <span className="profile-badge" style={{ width: 36, height: 36 }}>
                            <BadgeIcon badge={badge} monochrome={false} size={18} />
                          </span>
                          <span style={{
                            fontSize: 11,
                            color: owned ? "#10b981" : "#a1a1aa",
                            background: "#09090b",
                            border: "1px solid #27272a",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontWeight: 500,
                          }}>
                            {owned ? (earnedViaDiscord ? "Owned · role" : "Owned") : `$${price.toFixed(2)}`}
                          </span>
                        </div>
                        <strong style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#f4f4f5", marginBottom: 6 }}>
                          {badge.name}
                        </strong>
                        <p style={{ fontSize: 12, color: "#71717a", margin: 0, lineHeight: 1.45 }}>
                          {descriptions[badge.id] || "A distinctive mark on your profile."}
                        </p>
                      </div>
                      <button
                        className={owned ? "btn-secondary" : "btn-primary"}
                        onClick={() => !owned && handleBuyBadge(badge.id, badge.name)}
                        disabled={owned}
                        style={{ width: "100%", marginTop: 16, height: 36, opacity: owned ? 0.55 : 1 }}
                      >
                        {owned ? "Owned" : "Acquire"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="mp-inv">
            {!userId ? (
              <div style={{ textAlign: "center", padding: "16px 8px" }}>
                <h3 style={{ marginBottom: 12 }}>Your inventory</h3>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 20, lineHeight: 1.5 }}>
                  Log in to see your acquired premium handles and profile badges.
                </p>
                <button className="btn-primary" onClick={() => router.push("/login?next=/marketplace")} style={{ width: "100%", height: 38 }}>
                  Log in to purchase
                </button>
              </div>
            ) : (
              <>
                <h3>Your inventory</h3>

                <div style={{ marginBottom: 28 }}>
                  <h4>Handles ({myUsernames.length})</h4>
                  {myUsernames.length === 0 ? (
                    <div className="mp-empty">No premium handles yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {myUsernames.map((name) => (
                        <div key={name} className="mp-item" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                          <span>@{name}</span>
                          <span style={{ fontSize: 11, color: "#10b981" }}>Active</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4>Badges ({myBadges.length})</h4>
                  {myBadges.length === 0 ? (
                    <div className="mp-empty">No badges purchased yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {myBadges.map((badgeId) => {
                        const badge = availableBadges.find((b) => b.id === badgeId);
                        return (
                          <div key={badgeId} className="mp-item">
                            <BadgeIcon badge={badge || { id: badgeId, name: badgeId, icon: "⭐" }} monochrome={false} size={16} />
                            <span style={{ fontWeight: 500 }}>{badge?.name || badgeId}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
