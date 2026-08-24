"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Sparkles, ShoppingBag, ArrowLeft, Award, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isPremiumUsername, MARKETPLACE_PRICES } from "@/lib/constants";
import { purchaseUsername, purchaseBadge } from "./actions";

type BadgeItem = { id: string; name: string; icon: string };

export default function MarketplaceClient({
  userId,
  myUsernames,
  myBadges,
  availableBadges,
}: {
  userId: string;
  myUsernames: string[];
  myBadges: string[];
  availableBadges: BadgeItem[];
}) {
  const router = useRouter();
  const supabase = createClient();

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
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, rgba(225,29,47,.18), #050507 60%)", color: "#e8e8ef", padding: "40px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <button onClick={() => router.push("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "#9a9aaa", cursor: "pointer", fontSize: 14 }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={20} style={{ color: "#e11d2f" }} />
            <span style={{ fontWeight: 700, fontSize: 18 }}>rezu<span style={{ color: "#e11d2f" }}>.lol</span> Marketplace</span>
          </div>
        </header>

        {/* Search Username Section */}
        <section style={{ background: "#0a0a10", border: "1px solid #18181f", borderRadius: 18, padding: 28, marginBottom: 30 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>
            <ShoppingBag size={20} style={{ color: "#e11d2f" }} /> Buy Premium Handles
          </h2>
          <p style={{ color: "#9a9aaa", fontSize: 14, margin: "0 0 20px" }}>
            All 1-letter, 2-letter, and select 3-letter handles are restricted. Purchase ownership of them here.
          </p>

          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b6b7b", fontSize: 15 }}>
              rezu.lol/
            </span>
            <input 
              type="text"
              className="field" 
              style={{ paddingLeft: 76, width: "100%", boxSizing: "border-box" }}
              value={searchName}
              onChange={(e) => checkUsername(e.target.value)}
              placeholder="ab"
            />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
              {searchStatus === "checking" && <Loader2 size={18} className="spin" style={{ color: "#6b6b7b" }} />}
              {searchStatus === "available" && <Check size={18} style={{ color: "#4ade80" }} />}
              {(searchStatus === "taken" || searchStatus === "purchased" || searchStatus === "not_premium") && <X size={18} style={{ color: "#f87171" }} />}
            </span>
          </div>

          {/* Feedback Display */}
          <div style={{ minHeight: 24, fontSize: 13, marginTop: 10 }}>
            {searchStatus === "available" && (
              <span style={{ color: "#4ade80" }}>
                Available! Price: <strong>${getUsernamePrice()?.toFixed(2)}</strong>
              </span>
            )}
            {searchStatus === "taken" && <span style={{ color: "#f87171" }}>Already claimed by a user.</span>}
            {searchStatus === "purchased" && <span style={{ color: "#f87171" }}>Already purchased by someone.</span>}
            {searchStatus === "not_premium" && <span style={{ color: "#9a9aaa" }}>This handle is not premium. You can claim it for free inside the Claim dashboard!</span>}
            {error && <span style={{ color: "#f87171" }}>{error}</span>}
          </div>

          {searchStatus === "available" && (
            <button 
              className="btn" 
              onClick={handleBuyUsername}
              disabled={loading}
              style={{ background: "#e11d2f", color: "#fff", width: "100%", marginTop: 10, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
            >
              {loading ? <Loader2 size={16} className="spin" /> : `Purchase Handle for $${getUsernamePrice()?.toFixed(2)}`}
            </button>
          )}
        </section>

        {/* Badges Grid Section */}
        <section style={{ background: "#0a0a10", border: "1px solid #18181f", borderRadius: 18, padding: 28, marginBottom: 30 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>
            <Award size={20} style={{ color: "#e11d2f" }} /> Buy Premium Profile Badges
          </h2>
          <p style={{ color: "#9a9aaa", fontSize: 14, margin: "0 0 24px" }}>
            Unlock exclusive badges to stand out on your public biolink page.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {availableBadges.map((badge) => {
              const owned = myBadges.includes(badge.id);
              const price = MARKETPLACE_PRICES[badge.id] || 0;

              return (
                <div key={badge.id} style={{ background: "#0d0d14", border: "1px solid #20202a", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28, background: "#15151e", padding: 8, borderRadius: 10 }}>{badge.icon}</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ fontSize: 15 }}>{badge.name}</strong>
                      <small style={{ color: "#9a9aaa", fontSize: 12 }}>
                        {owned ? "Owned" : `$${price?.toFixed(2)}`}
                      </small>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => !owned && handleBuyBadge(badge.id, badge.name)}
                    disabled={owned}
                    className="btn"
                    style={{ 
                      width: "100%", 
                      fontSize: 13,
                      padding: "8px 12px",
                      background: owned ? "#15151d" : "#e11d2f", 
                      color: owned ? "#6b6b7b" : "#fff",
                      border: owned ? "1px solid #24242c" : "none",
                      cursor: owned ? "default" : "pointer"
                    }}
                  >
                    {owned ? "Unlocked" : "Buy Badge"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Owned Items Section */}
        <section style={{ background: "#0a0a10", border: "1px solid #18181f", borderRadius: 18, padding: 28 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
            <Crown size={18} style={{ color: "#e11d2f" }} /> Your Purchased Inventory
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, color: "#9a9aaa", margin: "0 0 10px" }}>Purchased Handles ({myUsernames.length})</h3>
              {myUsernames.length === 0 ? (
                <p style={{ fontSize: 13, color: "#6b6b7b" }}>No premium handles owned yet.</p>
              ) : (
                <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {myUsernames.map((name) => (
                    <li key={name} style={{ background: "#0d0d14", border: "1px solid #20202a", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontFamily: "monospace" }}>
                      @{name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 14, color: "#9a9aaa", margin: "0 0 10px" }}>Unlocked Badges ({myBadges.length})</h3>
              {myBadges.length === 0 ? (
                <p style={{ fontSize: 13, color: "#6b6b7b" }}>No premium badges owned yet.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {myBadges.map((badgeId) => {
                    const badge = availableBadges.find((b) => b.id === badgeId);
                    return (
                      <span key={badgeId} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0d0d14", border: "1px solid #20202a", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                        <span>{badge?.icon || "⭐"}</span> {badge?.name || badgeId}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}
