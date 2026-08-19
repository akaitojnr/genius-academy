"use client";

export default function JoinClassButton({
  liveClassId,
  meetingLink,
  isLive,
}: {
  liveClassId: string;
  meetingLink: string;
  isLive: boolean;
}) {
  function handleClick() {
    // Fire-and-forget: don't block opening the meeting on this request.
    fetch(`/api/live-classes/${liveClassId}/attend`, { method: "POST" }).catch(() => {});
  }

  return (
    <a
      href={meetingLink}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white ${
        isLive ? "bg-red-600 hover:bg-red-700" : "bg-brand-700 hover:bg-brand-800"
      }`}
    >
      Join Class
    </a>
  );
}
