import Link from "next/link";
import BrandMark from "./BrandMark";
import { DISCORD_INVITE_URL } from "@/lib/constants";

export default function SiteHeader({
  signedIn = false,
  username = "",
}: {
  signedIn?: boolean;
  username?: string;
}) {
  return (
    <header className="site-header">
      <Link href="/" className="site-header-brand">
        <BrandMark />
      </Link>
      <nav className="site-header-nav">
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">
          Discord
        </a>
        {signedIn ? (
          <>
            <Link href="/marketplace">Marketplace</Link>
            <Link href={username ? "/dashboard" : "/claim"} className="btn-primary">
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="btn-primary">
              Claim name
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
