/**
 * Client-side image compressor & resizer for profile photos and attachments.
 * Prevents localStorage QuotaExceededError and mobile browser memory crashes.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export const compressImageFile = async (
  file: File,
  options: CompressImageOptions = {}
): Promise<string> => {
  const {
    maxWidth = 360,
    maxHeight = 360,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  if (!file) {
    throw new Error('No file provided');
  }

  // If not an image, read as raw data URL directly
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const rawUrl = reader.result;
      if (typeof rawUrl !== 'string') {
        reject(new Error('Invalid image result'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to rawUrl if HTML Image tag fails
        resolve(rawUrl);
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute aspect ratio scaling
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl);
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // For transparent PNGs converted to JPEG, fill dark background matching CPT theme
          if (mimeType === 'image/jpeg') {
            ctx.fillStyle = '#10141f';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed data URL (typically 15KB - 40KB for 360x360 profile photos)
          const compressed = canvas.toDataURL(mimeType, quality);
          resolve(compressed);
        } catch (canvasErr) {
          console.warn('Canvas compression error, falling back:', canvasErr);
          // If canvas fails (e.g. cross-origin or rare security restrictions), fallback safely
          resolve(rawUrl);
        }
      };

      img.src = rawUrl;
    };

    reader.readAsDataURL(file);
  });
};
