"use server";

// Manual Discord ID linking is intentionally disabled.
// A Discord account can only be linked through Discord OAuth identity linking.
export async function saveDiscordPresence() {
  return { error: "Manual Discord ID linking is disabled. Please link Discord by signing in with Discord on the setup page." };
}
