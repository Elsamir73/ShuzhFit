import { useCallback, useEffect, useRef, useState } from "react";
import "../styles/videos.css";

type Video = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string | null;
  durationLabel: string | null;
  isShort: boolean;
};

const CHANNEL_URL = "https://www.youtube.com/@ShuzhFit";
const MORE_URL = `${CHANNEL_URL}/videos`;
const SUBSCRIBE_URL = `${CHANNEL_URL}?sub_confirmation=1`;
const MAX_VIDEOS = 5; // change to 4 if you want only four

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function toVideo(raw: unknown): Video | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id) ?? str(raw.videoId);
  if (!id) return null;

  const label = str(raw.durationLabel);
  const seconds =
    typeof raw.durationSeconds === "number" && raw.durationSeconds > 0
      ? raw.durationSeconds
      : null;

  return {
    id,
    title: str(raw.title) ?? "ShuzhFit video",
    thumbnail:
      str(raw.thumbnail) ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    publishedAt: str(raw.publishedAt),
    // only accept m:ss labels, never the old "0 min" text
    durationLabel:
      label && /^\d+:\d{2}$/.test(label)
        ? label
        : seconds
          ? formatDuration(seconds)
          : null,
    isShort: raw.isShort !== false,
  };
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days < 1) return "Today";
  if (days < 7) return plural(days, "day");
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose]);

  const id = encodeURIComponent(video.id);

  return (
    <div
      className="vp-modal"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
    >
      <div
        className={`vp-modal-box${video.isShort ? " is-short" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="vp-modal-close"
          onClick={onClose}
          aria-label="Close video"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="vp-modal-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        <div className="vp-modal-foot">
          <p>{video.title}</p>
          <a
            className="vp-btn vp-btn--primary"
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

export function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [selected, setSelected] = useState<Video | null>(null);
  const closeModal = useCallback(() => setSelected(null), []);

  useEffect(() => {
    document.title = "Videos | ShuzhFit";
    const controller = new AbortController();

    fetch("/api/youtube/videos", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<unknown>;
      })
      .then((data) => {
        const list: unknown[] = Array.isArray(data)
          ? data
          : isRecord(data) && Array.isArray(data.videos)
            ? data.videos
            : [];
        const items = list
          .map(toVideo)
          .filter((video): video is Video => video !== null)
          .slice(0, MAX_VIDEOS);
        setVideos(items);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="vp">
      <div className="vp-wrap">
        <header className="vp-head">
          <div>
            <span className="vp-eyebrow">From the channel</span>
            <h1 className="vp-title">Videos</h1>
            <p className="vp-sub">
              Real training, real form. Quick breakdowns from my channel to
              sharpen your movement.
            </p>
          </div>
          <div className="vp-actions">
            <a
              className="vp-btn vp-btn--primary"
              href={SUBSCRIBE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe
            </a>
            <a
              className="vp-btn"
              href={MORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch more on YouTube
            </a>
          </div>
        </header>

        {status === "loading" && (
          <div className="vp-grid" aria-busy="true">
            {Array.from({ length: MAX_VIDEOS }, (_, index) => (
              <div key={index} className="vp-card">
                <div className="vp-thumb vp-skel" />
                <div className="vp-skel vp-skel-line" />
              </div>
            ))}
          </div>
        )}

        {status === "ready" && videos.length > 0 && (
          <ul className="vp-grid">
            {videos.map((video) => (
              <li key={video.id} className="vp-item">
                <button
                  type="button"
                  className="vp-card"
                  onClick={() => setSelected(video)}
                >
                  <span className="vp-thumb">
                    <img src={video.thumbnail} alt="" loading="lazy" />
                    <span className="vp-play">
                      <PlayIcon />
                    </span>
                    {video.durationLabel && (
                      <span className="vp-badge">{video.durationLabel}</span>
                    )}
                  </span>
                  <span className="vp-card-title">{video.title}</span>
                  {video.publishedAt && (
                    <span className="vp-date">
                      {timeAgo(video.publishedAt)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {(status === "error" ||
          (status === "ready" && videos.length === 0)) && (
          <div className="vp-empty">
            <h2>Watch everything on YouTube</h2>
            <p>
              The video list couldn't load right now, but the whole channel is
              one click away.
            </p>
            <a
              className="vp-btn vp-btn--primary"
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the channel
            </a>
          </div>
        )}

        <section className="vp-cta">
          <div>
            <h2>More workouts on YouTube</h2>
            <p>
              New training videos and Shorts are posted on the channel.
              Subscribe so you don't miss them.
            </p>
          </div>
          <div className="vp-actions">
            <a
              className="vp-btn vp-btn--primary"
              href={SUBSCRIBE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe
            </a>
            <a
              className="vp-btn"
              href={MORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch more on YouTube
            </a>
          </div>
        </section>
      </div>

      {selected && <VideoModal video={selected} onClose={closeModal} />}
    </main>
  );
}

export default VideosPage;
