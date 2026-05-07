// Resize images client-side before upload.
// Inference only needs 224x224, but we keep 1280px max to preserve some headroom
// for visual_traits analysis. Saves 60-90% bandwidth on phone photos.

const MAX_DIM = 1280;
const QUALITY = 0.85;

export async function compressImage(file) {
  // Skip if already small (avoid degrading quality for tiny images)
  if (file.size < 500 * 1024) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // unsupported format → skip

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  if (scale === 1 && file.type === 'image/jpeg') {
    bitmap.close?.();
    return file; // already small enough and right format
  }

  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      if (!blob) return resolve(file);
      const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      // Only return compressed if it's actually smaller
      resolve(compressed.size < file.size ? compressed : file);
    }, 'image/jpeg', QUALITY);
  });
}
