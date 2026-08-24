import express from "express";
import {
  ActivityType,
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";

const {
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  PRESENCE_ROLE_ID,
  PRESENCE_API_KEY,
  PORT = 3000,
} = process.env;

if (!DISCORD_BOT_TOKEN) throw new Error("Missing DISCORD_BOT_TOKEN");
if (!DISCORD_GUILD_ID) throw new Error("Missing DISCORD_GUILD_ID");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.GuildMember, Partials.User],
});

function requireKey(req, res, next) {
  if (!PRESENCE_API_KEY) return next();
  if (req.header("x-api-key") !== PRESENCE_API_KEY) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  next();
}

function avatarUrl(user) {
  return user.displayAvatarURL({ size: 128, extension: "png" });
}

function avatarDecorationUrl(user) {
  const decoration = user.avatarDecorationData;
  if (!decoration?.asset) return null;
  return `https://cdn.discordapp.com/avatar-decoration-presets/${decoration.asset}.png?size=128&passthrough=true`;
}

function activityToJson(activity) {
  return {
    name: activity.name,
    type: activity.type,
    type_name: ActivityType[activity.type] || String(activity.type),
    details: activity.details || null,
    state: activity.state || null,
    url: activity.url || null,
    emoji: activity.emoji ? activity.emoji.name : null,
    created_at: activity.createdTimestamp || null,
    assets: activity.assets
      ? {
          large_text: activity.assets.largeText || null,
          small_text: activity.assets.smallText || null,
        }
      : null,
  };
}

async function getGuild() {
  return client.guilds.cache.get(DISCORD_GUILD_ID) || client.guilds.fetch(DISCORD_GUILD_ID);
}

client.once("ready", async () => {
  console.log(`rezu presence bot logged in as ${client.user.tag}`);
  const guild = await getGuild();
  console.log(`serving presence for ${guild.name}`);
});

client.on("guildMemberAdd", async (member) => {
  if (!PRESENCE_ROLE_ID) return;
  if (member.guild.id !== DISCORD_GUILD_ID) return;
  try {
    await member.roles.add(PRESENCE_ROLE_ID, "rezu.lol presence access");
  } catch (error) {
    console.error("failed to add presence role", error?.message || error);
  }
});

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, ready: client.isReady(), guild_id: DISCORD_GUILD_ID });
});

app.get("/presence/:id", requireKey, async (req, res) => {
  const id = String(req.params.id || "").replace(/[^0-9]/g, "");
  if (!/^[0-9]{15,25}$/.test(id)) {
    return res.status(400).json({ ok: false, error: "Invalid Discord user ID" });
  }

  if (!client.isReady()) {
    return res.status(503).json({ ok: false, error: "Bot is not ready yet" });
  }

  try {
    const guild = await getGuild();
    const member = await guild.members.fetch({ user: id, force: true }).catch(() => null);

    if (!member) {
      return res.status(404).json({ ok: false, joined: false, error: "User is not in the Discord server" });
    }

    const user = await client.users.fetch(id, { force: true });
    const presence = member.presence || guild.presences.cache.get(id);

    return res.json({
      ok: true,
      joined: true,
      status: presence?.status || "offline",
      activities: (presence?.activities || []).map(activityToJson),
      user: {
        id: user.id,
        username: user.username,
        global_name: user.globalName,
        avatar_url: avatarUrl(user),
        avatar_decoration_url: avatarDecorationUrl(user),
      },
      member: {
        display_name: member.displayName,
        guild_avatar_url: member.displayAvatarURL({ size: 128, extension: "png" }),
        roles: member.roles.cache.map((role) => role.id),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error?.message || "Presence lookup failed" });
  }
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`presence API listening on :${PORT}`);
});

client.login(DISCORD_BOT_TOKEN);
