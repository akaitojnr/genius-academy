"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoPlayer({
  lessonId,
  url,
  thumbnailUrl,
  teacherName,
  durationSec,
  startAtSeconds,
}: {
  lessonId: string;
  url: string;
  thumbnailUrl?: string | null;
  teacherName?: string | null;
  durationSec?: number | null;
  startAtSeconds: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // Resume playback from the last saved position once metadata loads.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => {
      if (startAtSeconds > 0 && startAtSeconds < video.duration - 5) {
        video.currentTime = startAtSeconds;
      }
      setReady(true);
    };
    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [startAtSeconds]);

  // Save resume position every 10s of playback (low-bandwidth friendly —
  // not on every timeupdate tick).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let lastSaved = 0;

    const onTimeUpdate = () => {
      const t = Math.floor(video.currentTime);
      if (t - lastSaved >= 10) {
        lastSaved = t;
        fetch(`/api/lessons/${lessonId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoSeconds: t }),
        }).catch(() => {});
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [lessonId]);

  const formattedDuration = durationSec
    ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
      <video
        ref={videoRef}
        src={url}
        poster={thumbnailUrl ?? undefined}
        controls
        preload="metadata"
        className="aspect-video w-full bg-black"
      />
      <div className="flex items-center justify-between bg-white px-4 py-2 text-xs text-slate-500">
        <span>{teacherName ? `Taught by ${teacherName}` : ""}</span>
        <span>{formattedDuration ?? ""}</span>
      </div>
      {!ready && startAtSeconds > 0 && (
        <p className="bg-brand-50 px-4 py-1 text-xs text-brand-700">Resuming from where you left off…</p>
      )}
    </div>
  );
}
