"use client";

import { useEffect, useRef, useState } from "react";

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

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

  const ytId = getYouTubeId(url);

  // Resume playback from the last saved position once metadata loads (for raw mp4 videos).
  useEffect(() => {
    if (ytId) return; // Skip for YouTube
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
  }, [startAtSeconds, ytId]);

  // Save resume position every 10s of playback (for raw mp4 videos).
  useEffect(() => {
    if (ytId) return; // Skip for YouTube
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
  }, [lessonId, ytId]);

  const formattedDuration = durationSec
    ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}`
    : null;

  // Render YouTube Iframe Player
  if (ytId) {
    const embedUrl = `https://www.youtube.com/embed/${ytId}?start=${startAtSeconds || 0}`;
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <iframe
          src={embedUrl}
          title="Lesson Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full bg-black border-none"
        />
        <div className="flex items-center justify-between bg-white px-4 py-2 text-xs text-slate-500">
          <span>{teacherName ? `Taught by ${teacherName}` : ""}</span>
        </div>
      </div>
    );
  }

  // Render standard HTML5 Video Player (for raw MP4s)
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
