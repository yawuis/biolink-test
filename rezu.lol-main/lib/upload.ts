import { createClient } from "@/lib/supabase/client";

function extFrom(file: File) {
  return file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

export async function uploadFile(userId: string, kind: string, file: File) {
  const supabase = createClient();
  const ext = extFrom(file);
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}


export async function resizeCursorPng(file: File, size = 32) {
  if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
    throw new Error("Custom cursors must be PNG files.");
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not resize the cursor image.");
  }

  ctx.clearRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const x = Math.round((size - width) / 2);
  const y = Math.round((size - height) / 2);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, x, y, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not create cursor PNG.")), "image/png");
  });

  const base = file.name.replace(/\.png$/i, "").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 60) || "cursor";
  return new File([blob], `${base}-32x32.png`, { type: "image/png", lastModified: Date.now() });
}

export async function uploadHostedImage(userId: string, file: File) {
  const supabase = createClient();
  const ext = extFrom(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  const path = `${userId}/${Date.now()}-${safeName || `image.${ext}`}`;

  const { error } = await supabase.storage.from("image-host").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("image-host").getPublicUrl(path);
  const url = data.publicUrl;

  const { error: insertError } = await supabase.from("hosted_images").insert({
    user_id: userId,
    url,
    path,
    name: file.name,
    size: file.size,
  });
  if (insertError) throw insertError;

  return { url, path, name: file.name, size: file.size };
}

export async function deleteHostedImage(path: string, id: string) {
  const supabase = createClient();
  await supabase.storage.from("image-host").remove([path]);
  const { error } = await supabase.from("hosted_images").delete().eq("id", id);
  if (error) throw error;
}
