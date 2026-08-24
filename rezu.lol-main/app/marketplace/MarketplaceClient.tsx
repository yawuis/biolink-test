"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isPremiumUsername, MARKETPLACE_PRICES, DISCORD_ROLE_BADGES } from "@/lib/constants";
import { purchaseUsername, purchaseBadge } from "./actions";

type BadgeItem = { id: string; name: string; icon: string };

export default function MarketplaceClient({
  userId,
  discordId,
  myUsernames,
  myBadges,
  availableBadges,
}: {
  userId: string;
  discordId: string | null;
  myUsernames: string[];
  myBadges: string[];
  availableBadges: BadgeItem[];
}) {
  const router = useRouter();
  const supabase = createClient();

  // Fetch user's Discord roles to mark earned badges as owned
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

  // Username Search State
  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState<"idle" | "checking" | "available" | "taken" | "purchased" | "not_premium">("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check Username Availability
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

    // 1. Check if claimed in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${clean},alias.eq.${clean}`)
      .maybeSingle();

    if (profile) {
      setSearchStatus("taken");
      return;
    }

    // 2. Check if purchased in marketplace
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

  // Purchase Username Handler
  const handleBuyUsername = async () => {
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

  // Purchase Badge Handler
  const handleBuyBadge = async (badgeId: string, badgeName: string) => {
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

  // Calculate Price for searched username
  const getUsernamePrice = () => {
    const len = searchName.length;
    if (len === 1) return MARKETPLACE_PRICES.username_1_letter;
    if (len === 2) return MARKETPLACE_PRICES.username_2_letter;
    if (len === 3) return MARKETPLACE_PRICES.username_3_letter;
    return 0;
  };

  return (
    <main style={{ minHeight: "100vh", background: "#050507", color: "#a1a1aa", padding: "60px 24px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header navigation bar */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px" }}>
          <button 
            onClick={() => router.push("/dashboard")} 
            style={{ 
              background: "none", 
              border: "none", 
              color: "#71717a", 
              cursor: "pointer", 
              fontSize: "13px", 
              fontWeight: 500,
              fontFamily: "inherit",
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              padding: 0,
              transition: "color 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
          >
            <ArrowLeft size={14} /> Return to dashboard
          </button>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#f4f4f5", letterSpacing: "-0.01em" }}>
            rezu<span style={{ color: "#e11d2e" }}>.lol</span>
          </div>
        </header>

        {/* Main Split Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "60px" }} className="responsive-grid">
          
          <style>{`
            @media (min-width: 900px) {
              .responsive-grid {
                grid-template-columns: 1fr 320px !important;
              }
            }
            .spin { animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .badge-item-card {
              transition: border-color 0.2s ease, background-color 0.2s ease;
            }
            .badge-item-card:hover {
              border-color: #3f3f46 !important;
              background-color: #09090b !important;
            }
          `}</style>

          {/* Left Side: Marketplace Items */}
          <div>
            <div style={{ marginBottom: "50px" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "600", letterSpacing: "-0.03em", color: "#f4f4f5", margin: "0 0 12px" }}>
                Identity Marketplace
              </h1>
              <p style={{ fontSize: "15px", color: "#71717a", lineHeight: "1.6", margin: 0, maxWidth: "600px" }}>
                Curate your profile identity by securing premium handle reservations and acquiring distinctive profile badges. Items in your collection link directly to your profile.
              </p>
            </div>

            {/* Premium Handles Section */}
            <div style={{ paddingBottom: "48px", borderBottom: "1px solid #18181b", marginBottom: "48px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "500", color: "#f4f4f5", margin: "0 0 8px" }}>
                Premium Handles
              </h2>
              <p style={{ color: "#71717a", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.5" }}>
                All 1-letter, 2-letter, and select 3-letter handles are restricted. Check availability and secure your custom handle.
              </p>

              <div style={{ display: "flex", gap: "12px", alignItems: "stretch", maxWidth: "480px" }}>
                <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", background: "#09090b", border: "1px solid #27272a", borderRadius: "6px", width: "100%" }}>
                  <span style={{ paddingLeft: "14px", color: "#52525b", fontSize: "14px", userSelect: "none", fontFamily: "monospace" }}>
                    rezu.lol/
                  </span>
                  <input 
                    type="text"
                    value={searchName}
                    onChange={(e) => checkUsername(e.target.value)}
                    placeholder="ab"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#f4f4f5",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      padding: "10px 40px 10px 4px",
                      width: "100%",
                      outline: "none"
                    }}
                  />
                  <span style={{ position: "absolute", right: "14px", display: "flex", alignItems: "center" }}>
                    {searchStatus === "checking" && <Loader2 size={15} className="spin" style={{ color: "#71717a" }} />}
                    {searchStatus === "available" && <Check size={15} style={{ color: "#10b981" }} />}
                    {(searchStatus === "taken" || searchStatus === "purchased" || searchStatus === "not_premium") && <X size={15} style={{ color: "#ef4444" }} />}
                  </span>
                </div>

                {searchStatus === "available" && (
                  <button 
                    onClick={handleBuyUsername}
                    disabled={loading}
                    style={{
                      background: "#f4f4f5",
                      color: "#09090b",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0 20px",
                      fontWeight: "500",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e4e4e7")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f4f4f5")}
                  >
                    {loading ? <Loader2 size={13} className="spin" /> : "Acquire"}
                  </button>
                )}
              </div>

              <div style={{ minHeight: "20px", fontSize: "13px", marginTop: "10px" }}>
                {searchStatus === "available" && (
                  <span style={{ color: "#10b981" }}>
                    Available — Price: <strong>${getUsernamePrice()?.toFixed(2)}</strong>
                  </span>
                )}
                {searchStatus === "taken" && <span style={{ color: "#ef4444" }}>Already claimed by a user.</span>}
                {searchStatus === "purchased" && <span style={{ color: "#ef4444" }}>Already purchased by someone.</span>}
                {searchStatus === "not_premium" && <span style={{ color: "#71717a" }}>This is not a restricted handle. You can claim it for free in the dashboard!</span>}
                {error && <span style={{ color: "#ef4444" }}>{error}</span>}
              </div>
            </div>

            {/* Profile Badges Section */}
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "500", color: "#f4f4f5", margin: "0 0 8px" }}>
                Profile Badges
              </h2>
              <p style={{ color: "#71717a", fontSize: "14px", margin: "0 0 28px" }}>
                Acquire unique digital badges to display alongside your identity.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                {availableBadges.map((badge) => {
                  const roleBadge = DISCORD_ROLE_BADGES.find((dr) => dr.id === badge.id);
                  const earnedViaDiscord = roleBadge ? discordRoles.includes(roleBadge.roleId) : false;
                  const owned = myBadges.includes(badge.id) || earnedViaDiscord;
                  const price = MARKETPLACE_PRICES[badge.id] || 0;

                  return (
                    <div 
                      key={badge.id}
                      style={{
                        background: "#09090b",
                        border: "1px solid #18181b",
                        borderRadius: "8px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "140px"
                      }}
                      className="badge-item-card"
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <span style={{ fontSize: "32px", lineHeight: 1 }}>{badge.icon}</span>
                          <span style={{ 
                            fontSize: "11px", 
                            color: owned ? "#10b981" : "#a1a1aa", 
                            background: owned ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.03)", 
                            padding: "3px 8px", 
                            borderRadius: "4px", 
                            fontWeight: "500" 
                          }}>
                            {owned ? (earnedViaDiscord ? "Owned (Role)" : "Owned") : `$${price?.toFixed(2)}`}
                          </span>
                        </div>
                        <strong style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#f4f4f5", marginBottom: "6px" }}>
                          {badge.name}
                        </strong>
                        <p style={{ fontSize: "12px", color: "#71717a", margin: 0, lineHeight: "1.4" }}>
                          {badge.id === "rich" && "Distinctive styling for contributors and supporters."}
                          {badge.id === "og" && "Early profile registration badge for pioneers."}
                          {badge.id === "donor" && "Unlocked badge representing active server funding."}
                          {badge.id === "premium" && "Premium platform validation status."}
                          {badge.id === "verified" && "Account authenticity check."}
                          {badge.id === "winner" && "Commendation for top community status."}
                          {badge.id === "early_supporter" && "Honoring users who believed in the product early on."}
                          {badge.id === "bug_hunter" && "For identifying issues and helping secure rezu.lol."}
                          {badge.id === "helper" && "Awarded for supportive community members."}
                          {badge.id === "staff" && "Exclusively for the official platform team."}
                          {badge.id === "owner" && "Identifies the core system administration."}
                        </p>
                      </div>

                      <div style={{ marginTop: "20px" }}>
                        <button
                          onClick={() => !owned && handleBuyBadge(badge.id, badge.name)}
                          disabled={owned}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: owned ? "1px solid #18181b" : "none",
                            background: owned ? "transparent" : "#ffffff",
                            color: owned ? "#3f3f46" : "#09090b",
                            fontSize: "12px",
                            fontWeight: "500",
                            cursor: owned ? "default" : "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => {
                            if (!owned) {
                              e.currentTarget.style.backgroundColor = "#e11d2e";
                              e.currentTarget.style.color = "#ffffff";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!owned) {
                              e.currentTarget.style.backgroundColor = "#ffffff";
                              e.currentTarget.style.color = "#09090b";
                            }
                          }}
                        >
                          {owned ? "Owned" : "Acquire Item"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Inventory Sticky Panel */}
          <div>
            <div style={{ position: "sticky", top: "40px", background: "#09090b", border: "1px solid #18181b", borderRadius: "8px", padding: "28px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#f4f4f5", margin: "0 0 20px" }}>
                My Inventory
              </h3>

              {/* Handles List */}
              <div style={{ marginBottom: "28px" }}>
                <h4 style={{ fontSize: "11px", fontWeight: "600", color: "#52525b", letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 12px" }}>
                  Reserved Handles ({myUsernames.length})
                </h4>
                {myUsernames.length === 0 ? (
                  <div style={{ border: "1px dashed #27272a", borderRadius: "6px", padding: "20px 16px", textAlign: "center" }}>
                    <p style={{ fontSize: "12px", color: "#52525b", margin: 0 }}>
                      No premium handles purchased yet.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {myUsernames.map((name) => (
                      <div 
                        key={name} 
                        style={{ 
                          background: "#040405", 
                          border: "1px solid #18181b", 
                          borderRadius: "6px", 
                          padding: "10px 14px", 
                          fontSize: "13px", 
                          fontFamily: "monospace",
                          color: "#e4e4e7",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span>@{name}</span>
                        <span style={{ fontSize: "10px", color: "#10b981", background: "rgba(16, 185, 129, 0.08)", padding: "2px 6px", borderRadius: "4px", fontWeight: 500 }}>Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Badges List */}
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: "600", color: "#52525b", letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 12px" }}>
                  Purchased Badges ({myBadges.length})
                </h4>
                {myBadges.length === 0 ? (
                  <div style={{ border: "1px dashed #27272a", borderRadius: "6px", padding: "20px 16px", textAlign: "center" }}>
                    <p style={{ fontSize: "12px", color: "#52525b", margin: 0 }}>
                      No premium badges purchased yet.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {myBadges.map((badgeId) => {
                      const badge = availableBadges.find((b) => b.id === badgeId);
                      return (
                        <div 
                          key={badgeId} 
                          style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "6px", 
                            background: "#040405", 
                            border: "1px solid #18181b", 
                            borderRadius: "6px", 
                            padding: "8px 12px", 
                            fontSize: "12px",
                            color: "#e4e4e7"
                          }}
                        >
                          <span style={{ fontSize: "16px", lineHeight: 1 }}>{badge?.icon || "⭐"}</span>
                          <span style={{ fontWeight: 500 }}>{badge?.name || badgeId}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
