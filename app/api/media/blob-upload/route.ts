/**
 * Vercel Blob browser upload token endpoint.
 * This endpoint is used ONLY for SKP deployments with SKP_MEDIA_PROVIDER=vercel-blob.
 * Existing Cloudflare /api/media remains unchanged until the migration is tested.
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAuthorizedAdmin } from "../../../../lib/admin-authorization";

const pathPattern = /^(products|slides)\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.(png|webp)$/;

export async function POST(request: Request) {
  if (process.env.SKP_MEDIA_PROVIDER !== "vercel-blob") {
    return Response.json({ error: "Blob uploads disabled" }, { status: 503 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "Blob storage not configured" }, { status: 503 });
  }
  if (process.env.SKP_ADMIN_REQUIRE_PASSKEY !== "true" && !process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Admin auth not configured" }, { status: 503 });
  }
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await isAuthorizedAdmin(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json() as HandleUploadBody;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (request.headers.get("origin") !== new URL(request.url).origin ||
            !(await isAuthorizedAdmin(request))) throw new Error("Unauthorized");
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
