"use client";

import { Globe } from "lucide-react";
import { PLATFORMS } from "./platforms";

export default function BrandIcon({
  platform,
  size = 22,
  monochrome = false,
  color = "#ffffff",
}: {
  platform: string;
  size?: number;
  monochrome?: boolean;
  color?: string;
}) {
  const meta = PLATFORMS[platform] || PLATFORMS.website;
  if (!meta.brandSlug) return <Globe size={size} color={color} strokeWidth={2} />;

  const hex = (monochrome ? color : meta.brandColor || color).replace("#", "");
  const src = `https://cdn.simpleicons.org/${meta.brandSlug}/${hex}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}
