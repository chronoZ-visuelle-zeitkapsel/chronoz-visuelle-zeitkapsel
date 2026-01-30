import React, { useEffect, useMemo, useRef, useState } from "react";

interface FrameByFrameCanvasProps {
  frameUrls: string[];
  fps?: number;
  loop?: boolean;
  playOnLoad?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function preloadImages(
  urls: string[],
  { crossOrigin }: { crossOrigin?: string } = {}
): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          if (crossOrigin) img.crossOrigin = crossOrigin;
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load: ${src}`));
          img.src = src;
        })
    )
  );
}

export default function FrameByFrameCanvas({
  frameUrls,
  fps = 24,
  loop = true,
  playOnLoad = true,
  className,
  style,
}: FrameByFrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ frameIndex: 0, isPlaying: playOnLoad, lastTime: 0, acc: 0 });

  const [frames, setFrames] = useState<HTMLImageElement[] | null>(null);
  const [error, setError] = useState("");

  const frameDuration = useMemo(() => 1000 / fps, [fps]);

  // 1) Frames laden
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      setFrames(null);
      console.log("Loading frames from:", frameUrls[0]);

      try {
        const imgs = await preloadImages(frameUrls);
        console.log("✓ Frames loaded:", imgs.length, "images");

        if (!cancelled) setFrames(imgs);
      } catch (e) {
        console.error("✗ Frame load error:", e);
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }

    if (frameUrls?.length) load();
    else setError("No frameUrls provided.");

    return () => {
      cancelled = true;
    };
  }, [frameUrls]);

  // 2) Animation Loop
  useEffect(() => {
    if (!frames || !canvasRef.current) {
      console.log("Not ready:", { frames: !!frames, canvas: !!canvasRef.current });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setError("Could not get 2D context");
      return;
    }

    console.log("Canvas ready, size:", canvas.width, "x", canvas.height);

    // Draw first frame immediately
    if (frames.length > 0) {
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[0], 0, 0, canvas.width, canvas.height);
      console.log("Drew first frame");
    }

    let frameIndex = 0;
    let lastTime = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      if (!stateRef.current.isPlaying) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = now - lastTime;
      lastTime = now;
      acc += dt;

      if (acc > 250) acc = 250;

      while (acc >= frameDuration) {
        acc -= frameDuration;
        frameIndex++;

        if (frameIndex >= frames.length) {
          if (loop) frameIndex = 0;
          else {
            frameIndex = frames.length - 1;
            stateRef.current.isPlaying = false;
          }
        }
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[frameIndex], 0, 0, canvas.width, canvas.height);

      stateRef.current.frameIndex = frameIndex;

      rafRef.current = requestAnimationFrame(tick);
    };

    stateRef.current.isPlaying = playOnLoad;
    stateRef.current.frameIndex = 0;
    stateRef.current.lastTime = performance.now();
    stateRef.current.acc = 0;

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [frames, frameDuration, loop, playOnLoad]);

  return (
    <div className={className} style={{ display: "grid", gap: 8, ...style }}>
      {error ? (
        <div style={{ padding: 12, border: "1px solid red", borderRadius: 8, color: "red" }}>
          <b>Error:</b> {error}
        </div>
      ) : null}

      {!frames && !error ? (
        <div style={{ 
          padding: 40, 
          textAlign: "center", 
          color: "#666",
          fontSize: "18px",
          fontWeight: 500
        }}>
          Loading...
        </div>
      ) : null}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={() => {
          stateRef.current.isPlaying = true;
          console.log("Canvas clicked, animation started");
        }}
        style={{
          display: frames ? "block" : "none",
          background: "transparent",
          borderRadius: 12,
          maxWidth: "100%",
          height: "auto",
          cursor: "pointer",
        }}
      />
    </div>
  );
}
