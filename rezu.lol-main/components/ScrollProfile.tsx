"use client";

import ProfileCard from "./ProfileCard";
import { type Profile } from "@/lib/constants";

export default function ScrollProfile({ profile }: { profile: Profile }) {
  return <ProfileCard profile={profile} />;
}
