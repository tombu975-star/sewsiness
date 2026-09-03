// Downscales/re-encodes an image on <canvas> before it's uploaded. A photo
// straight off a phone camera commonly runs 3–8MB; shrinking it client-side,
// before the network call even starts, is what actually makes "pick a
// photo" feel fast on a real connection — nothing server-side can undo an
// 8MB upload once it's already in flight.
//
// Best-effort by design: callers should catch and fall back to the
// original file if a browser can't do canvas encoding for some reason,
// rather than blocking the whole upload on it.
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: { maxDimension?: number; quality?: number } = {}
): Promise<{ blob: Blob; ext: string; type: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image."));
      el.src = objectUrl;
    });

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    ctx.drawImage(img, 0, 0, width, height);

    // PNG keeps transparency; everything else re-encodes as JPEG, which
    // compresses photos far better than PNG or the original WEBP would.
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, quality));
    if (!blob) throw new Error("canvas unsupported");
    return { blob, ext: outputType === "image/png" ? "png" : "jpg", type: outputType };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
