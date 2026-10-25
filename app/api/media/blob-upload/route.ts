/**
 * Vercel Blob browser upload token endpoint.
 * This endpoint is used ONLY for SKP deployments with SKP_MEDIA_PROVIDER=vercel-blob.
 * Existing Cloudflare /api/media remains unchanged until the migration is tested.
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { localAdminAccess } from "../../../../lib/local-admin-access";

const pathPattern = /^(products|slides)\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.(png|webp)$/;

async function authorized(request: Request): Promise<boolean> {
  if (localAdminAccess(request)) return true;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const bytes = await crypto.subtle.digest(
    "SHA-256", new TextEncoder().encode("skp-session:" + password)
  );
  const token = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
  return (request.headers.get("cookie") || "")
    .split(";").some(cookie => cookie.trim() === "skp_admin=" + token);
}

export async function POST(request: Request) {
  if (process.env.SKP_MEDIA_PROVIDER !== "vercel-blob") {
    return Response.json({ error: "Blob uploads disabled" }, { status: 503 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Blob storage or admin auth not configured" }, { status: 503 });
  }
  try {
    const body = await request.json() as HandleUploadBody;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (request.headers.get("origin") !== new URL(request.url).origin ||
            !(await authorized(request))) throw new Error("Unauthorized");
        if (!pathPattern.test(pathname)) throw new Error("Invalid media pathname");
        return {
          allowedContentTypes: ["image/png", "image/webp"],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async () => {
        // Product/gallery changes are persisted by the authenticated store API.
      },
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Не удалось подтвердить загрузку изображения" }, { status: 400 });
  }
}
