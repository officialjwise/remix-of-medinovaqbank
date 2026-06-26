import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Trash2, ZoomIn } from "lucide-react";
import { toast } from "sonner";

const MAX_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** Crop a source image to the given pixel area and return a square data URL. */
async function cropToDataUrl(src: string, area: Area, size = 320): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function AvatarUploader({
  value,
  initials,
  onSave,
  onRemove,
  size = 96,
}: {
  value?: string;
  initials: string;
  onSave: (dataUrl: string) => void;
  onRemove: () => void;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setAreaPixels(pixels), []);

  function pickFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a JP, PNG or WebP image");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_MB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!src || !areaPixels) return;
    setSaving(true);
    try {
      const dataUrl = await cropToDataUrl(src, areaPixels);
      onSave(dataUrl);
      toast.success("Profile photo updated");
      setSrc(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch {
      toast.error("Couldn't process the image");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="relative inline-block" style={{ width: size, height: size }}>
        {value ? (
          <img
            src={value}
            alt="avatar"
            className="h-full w-full rounded-2xl object-cover ring-2 ring-border"
            style={{ width: size, height: size }}
          />
        ) : (
          <span
            className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent font-bold text-white"
            style={{ width: size, height: size, fontSize: size / 3 }}
          >
            {initials}
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-md transition hover:bg-primary-light"
          aria-label="Change photo"
        >
          <Camera className="h-4 w-4" />
        </button>
        {value && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-error text-white shadow-md transition hover:opacity-90"
            aria-label="Remove photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {src && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
          onClick={() => setSrc(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="border-b border-border px-5 py-4">
              <h3 className="text-base font-bold text-foreground">Crop your photo</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Drag to reposition · pinch or use the slider to zoom
              </p>
            </header>
            <div className="relative h-72 w-full bg-surface-alt">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer accent-[var(--color-accent)]"
              />
            </div>
            <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => setSrc(null)}
                className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="h-10 rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save photo"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
