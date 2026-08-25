"use client";

import ProfileCard from "./ProfileCard";
import { type Profile } from "@/lib/constants";

export default function ScrollProfile({ profile, onRearrange }: { profile: Profile; onRearrange?: (modules: string[]) => void }) {
  return <ProfileCard profile={profile} onRearrange={onRearrange} />;
}
