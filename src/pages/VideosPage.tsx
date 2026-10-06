import { useEffect, useState } from "react";
import {
  type Video,
  getYouTubeVideoId,
  toYouTubeEmbedUrl,
} from "../lib/content";
import { loadVideos } from "../lib/contentApi";

export function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const selectedVideo = videos.find((video) => video.slug === playingVideo);
  const longVideos = videos.filter((video) => !video.isShort).slice(0, 6);
  const shorts = videos.filter((video) => video.isShort).slice(0, 4);

  useEffect(() => {
    let isMounted = true;

    void loadVideos().then((items) => {
      if (isMounted) {
        setVideos(items);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!playingVideo) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPlayingVideo(null); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [playingVideo]);

  return (
    <section className="pg page">
      <div className="container">
        <div className="pg-head">
          <span className="pg-kicker">ShuzhFit</span>
          <h1>Videos</h1>
          <p className="pg-intro">
            Quick coaching demos and exercise breakdowns to sharpen movement
            quality.
          </p>
        </div>

        <h2>Latest videos</h2><div className="content-grid video-grid">
          {isLoading ? (
            <p className="empty-state">Loading videos...</p>
          ) : longVideos.length === 0 ? (
            <div className="empty-state">
              <p>No videos are available right now.</p>
              <a href="https://www.youtube.com/@ShuzhFit" target="_blank" rel="noopener noreferrer">
                Watch on YouTube
              </a>
            </div>
          ) : (
            longVideos.map((video) => {
              const videoId = getYouTubeVideoId(video.youtubeUrl);
              const thumbnailUrl = video.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

              return (
                <article key={video.slug} className="content-card video-card">
                  <div className="video-frame">
                    <button
                        type="button"
                        className="video-thumb"
                        onClick={() => setPlayingVideo(video.slug)}
                        aria-label={`Play ${video.title}`}
                        style={{
                          backgroundImage: thumbnailUrl
                            ? `url(${thumbnailUrl})`
                            : "none",
                        }}
                      >
                        <span className="video-play">Play</span>
                    </button>
                  </div>

                  <div className="content-body">
                    <div className="video-meta-row">
                      <span className="content-meta">Video</span>
                      <a
                        className="video-link"
                        href={video.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch on YouTube
                      </a>
                    </div>
                    <h3>{video.title}</h3>
                    <p className="content-summary">{video.description}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
        {shorts.length ? <><h2>Shorts</h2><div className="content-grid video-grid">{shorts.map((video) => <article key={video.slug} className="content-card video-card"><button type="button" className="video-thumb" onClick={() => setPlayingVideo(video.slug)} aria-label={`Play ${video.title}`} style={{ backgroundImage: `url(${video.thumbnail})` }}><span className="video-play">Play</span></button><div className="content-body"><h3>{video.title}</h3><a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube</a></div></article>)}</div></> : null}
        <div className="btn-row"><a className="btn btn-primary" href="https://www.youtube.com/@ShuzhFit/videos" target="_blank" rel="noopener noreferrer">Watch more on YouTube</a><a className="btn btn-secondary" href="https://www.youtube.com/@ShuzhFit?sub_confirmation=1" target="_blank" rel="noopener noreferrer">Subscribe</a></div>
      </div>
      {selectedVideo ? <div className="video-modal-overlay" role="presentation" onClick={() => setPlayingVideo(null)}><div className={`video-modal app-panel${selectedVideo.isShort ? " is-short" : ""}`} role="dialog" aria-modal="true" aria-label={selectedVideo.title} onClick={(event) => event.stopPropagation()}><div className="meal-day-header"><h2>{selectedVideo.title}</h2><button className="btn btn-secondary" onClick={() => setPlayingVideo(null)} aria-label="Close video">Close</button></div><div className="video-modal-frame"><iframe title={selectedVideo.title} src={`${toYouTubeEmbedUrl(selectedVideo.youtubeUrl)}?rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><a className="btn btn-primary" href={selectedVideo.youtubeUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube</a></div></div> : null}
    </section>
  );
}
