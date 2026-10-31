import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Dumbbell,
  Gauge,
  Lightbulb,
  Play,
  Plus,
  Repeat,
  Target,
  Timer,
  Wrench,
} from "lucide-react";
import "../styles/exercise-guide.css";

export type RelatedExercise = { slug: string; name: string; meta?: string };

type Props = {
  name: string;
  category?: string;
  summary?: string;
  muscles: string[];
  equipment?: string;
  level?: string;
  reps?: string;
  rest?: string;
  steps: string[];
  tips: string[];
  mistakes: string[];
  related: RelatedExercise[];
  addToWorkoutHref?: string;
  children?: ReactNode;
};

type ChannelVideo = {
  id: string;
  title: string;
  thumbnail: string;
  isShort: boolean;
  publishedAt: string;
};

const CHANNEL_URL = "https://www.youtube.com/@ShuzhFit";

const GROUPS: { test: RegExp; title: RegExp }[] = [
  { test: /chest|pec/i, title: /chest/i },
  { test: /lat|back|rhomboid|trap/i, title: /back/i },
  { test: /shoulder|delt/i, title: /shoulder/i },
  { test: /bicep|tricep|forearm|arm/i, title: /arm|bicep|tricep/i },
  { test: /quad|glute|hamstring|calf|leg|hip/i, title: /leg/i },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Splits a "Problem: fix" mistake row into a bold lead and the fix. */
function splitLead(text: string): { lead: string; fix: string } | null {
  const index = text.indexOf(": ");
  if (index <= 0) return null;
  return { lead: text.slice(0, index), fix: text.slice(index + 2) };
}

function toVideo(raw: unknown): ChannelVideo | null {
  if (!isRecord(raw)) return null;
  const id =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw.videoId === "string"
        ? raw.videoId
        : null;
  if (!id) return null;
  return {
    id,
    title: typeof raw.title === "string" ? raw.title : "ShuzhFit video",
    thumbnail:
      typeof raw.thumbnail === "string" && raw.thumbnail
        ? raw.thumbnail
        : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    isShort: raw.isShort === true,
    publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : "",
  };
}

/** Finds a channel video whose title matches the first muscle (Chest Day for chest, Leg Day for legs). */
function useMatchingVideo(muscles: string[]): ChannelVideo | null {
  const [video, setVideo] = useState<ChannelVideo | null>(null);
  const first = muscles[0] ?? "";

  useEffect(() => {
    const group = GROUPS.find((entry) => entry.test.test(first));
    if (!group) return;
    const controller = new AbortController();

    fetch("/api/youtube/videos", { signal: controller.signal })
      .then((res) =>
        res.ok
          ? (res.json() as Promise<unknown>)
          : Promise.reject(new Error(String(res.status))),
      )
      .then((data) => {
        const list: unknown[] = Array.isArray(data)
          ? data
          : isRecord(data) && Array.isArray(data.videos)
            ? data.videos
            : [];
        const match = list
          .map(toVideo)
          .filter((item): item is ChannelVideo => item !== null)
          .sort(
            (a, b) =>
              Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || ""),
          )
          .find((item) => group.title.test(item.title));
        setVideo(match ?? null);
      })
      .catch(() => setVideo(null));

    return () => controller.abort();
  }, [first]);

  return video;
}

export function ExerciseGuide(props: Props) {
  const {
    name,
    category,
    summary,
    muscles,
    equipment,
    level,
    reps,
    rest,
    steps,
    tips,
    mistakes,
    related,
  } = props;
  const video = useMatchingVideo(muscles);
  const addHref = props.addToWorkoutHref ?? "/workout";
  const videoUrl = video
    ? video.isShort
      ? `https://www.youtube.com/shorts/${encodeURIComponent(video.id)}`
      : `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`
    : CHANNEL_URL;

  return (
    <main className="eg">
      <div className="eg-wrap">
        <Link to="/exercises" className="eg-back">
          <ArrowLeft size={18} aria-hidden="true" /> Back to workouts
        </Link>

        <header className="eg-head">
          {category && <span className="eg-badge">{category}</span>}
          <h1 className="eg-title">{name}</h1>
          {summary && <p className="eg-summary">{summary}</p>}
          {muscles.length > 0 && (
            <ul className="eg-pills">
              {muscles.map((muscle) => (
                <li key={muscle}>{muscle}</li>
              ))}
            </ul>
          )}
        </header>

        <div className="eg-grid">
          <div className="eg-main">
            {steps.length > 0 && (
              <section className="eg-card">
                <h2 className="eg-h">How to do it</h2>
                <ol className="eg-steps">
                  {steps.map((step, index) => (
                    <li key={index}>
                      <span className="eg-num">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {tips.length > 0 && (
              <section className="eg-card">
                <h2 className="eg-h">
                  <Lightbulb size={20} aria-hidden="true" /> Coach tips
                </h2>
                <ul className="eg-list eg-list--tips">
                  {tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </section>
            )}

            {mistakes.length > 0 && (
              <section className="eg-card">
                <h2 className="eg-h">
                  <AlertTriangle size={20} aria-hidden="true" /> Common mistakes
                </h2>
                <ul className="eg-list eg-list--mistakes">
                  {mistakes.map((mistake, index) => {
                    const parts = splitLead(mistake);
                    return (
                      <li key={index}>
                        {parts ? (
                          <>
                            <strong>{parts.lead}:</strong> {parts.fix}
                          </>
                        ) : (
                          mistake
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {props.children}
          </div>

          <aside className="eg-side">
            <a
              className="eg-video"
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {video ? (
                <span className="eg-video-thumb">
                  <img
                    src={video.thumbnail}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                  <span className="eg-video-play">
                    <Play size={22} aria-hidden="true" />
                  </span>
                </span>
              ) : (
                <span className="eg-video-thumb eg-video-thumb--empty">
                  <Play size={30} aria-hidden="true" />
                </span>
              )}
              <span className="eg-video-body">
                <strong>
                  {video ? video.title : "Watch more on my channel"}
                </strong>
                <small>
                  {video
                    ? "ShuzhFit on YouTube"
                    : "Form guides and training tips on YouTube"}
                </small>
              </span>
            </a>

            <Link to={addHref} className="eg-add">
              <Plus size={20} aria-hidden="true" /> Add to today's workout
            </Link>

            <section className="eg-card eg-details">
              <h2 className="eg-h">Quick details</h2>
              <dl>
                {equipment && (
                  <div>
                    <dt>
                      <Wrench size={16} aria-hidden="true" /> Equipment
                    </dt>
                    <dd>{equipment}</dd>
                  </div>
                )}
                {level && (
                  <div>
                    <dt>
                      <Gauge size={16} aria-hidden="true" /> Difficulty
                    </dt>
                    <dd>{level}</dd>
                  </div>
                )}
                {muscles.length > 0 && (
                  <div>
                    <dt>
                      <Target size={16} aria-hidden="true" /> Primary muscles
                    </dt>
                    <dd>{muscles.slice(0, 2).join(", ")}</dd>
                  </div>
                )}
                {reps && (
                  <div>
                    <dt>
                      <Repeat size={16} aria-hidden="true" /> Reps
                    </dt>
                    <dd>{reps}</dd>
                  </div>
                )}
                {rest && (
                  <div>
                    <dt>
                      <Timer size={16} aria-hidden="true" /> Rest
                    </dt>
                    <dd>{rest}</dd>
                  </div>
                )}
              </dl>
            </section>

            {related.length > 0 && (
              <section className="eg-card">
                <h2 className="eg-h">Related exercises</h2>
                <ul className="eg-related">
                  {related.slice(0, 3).map((item) => (
                    <li key={item.slug}>
                      <Link to={`/exercises/${item.slug}`}>
                        <span className="eg-related-icon">
                          <Dumbbell size={20} aria-hidden="true" />
                        </span>
                        <span className="eg-related-text">
                          <strong>{item.name}</strong>
                          {item.meta && <small>{item.meta}</small>}
                        </span>
                        <ChevronRight size={18} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default ExerciseGuide;
