import React, { useEffect, useState } from 'react';
import { Download, FileText, ImageOff } from 'lucide-react';
import { getSupportAttachmentUrl } from '../lib/supabase';

interface SupportAttachmentProps {
  reference: string;
  name?: string;
  type?: 'image' | 'file';
  onPreview?: (url: string) => void;
}

/** Shared attachment preview and download control for customer and admin chat. */
export const SupportAttachment: React.FC<SupportAttachmentProps> = ({
  reference,
  name,
  type,
  onPreview,
}) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      getSupportAttachmentUrl(reference),
      getSupportAttachmentUrl(reference, true, name),
    ])
      .then(([preview, download]) => {
        if (!active) return;
        setPreviewUrl(preview);
        setDownloadUrl(download);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load attachment.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reference, name]);

  const safeName = name || (type === 'image' ? 'Image attachment' : 'Download attachment');

  return (
    <div className="mb-2 block w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-[#303b54] bg-black/15 p-2">
      {type === 'image' ? (
        previewUrl ? (
          <button
            type="button"
            onClick={() => onPreview?.(previewUrl)}
            className="block w-full min-w-0 max-w-full cursor-zoom-in"
            title="View image"
          >
            <img
              src={previewUrl}
              alt={safeName}
              className="block h-auto max-h-56 w-auto max-w-full rounded-lg object-contain"
            />
          </button>
        ) : (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
            <ImageOff className="h-4 w-4 shrink-0" />
            <span>{loading ? 'Loading image…' : error || 'Image unavailable'}</span>
          </div>
        )
      ) : (
        <div className="flex min-w-0 items-center gap-2 px-1 py-1 text-xs text-slate-200">
          <FileText className="h-5 w-5 shrink-0 text-amber-400" />
          <span className="max-w-[190px] truncate font-semibold">{safeName}</span>
        </div>
      )}

      <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2">
        <span className="min-w-0 flex-1 basis-[110px] truncate text-[10px] text-slate-400">{safeName}</span>
        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={safeName}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        ) : (
          <span className="shrink-0 text-[10px] text-rose-300">{loading ? 'Preparing…' : error || 'Unavailable'}</span>
        )}
      </div>
    </div>
  );
};
