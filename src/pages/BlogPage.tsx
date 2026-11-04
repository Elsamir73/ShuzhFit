import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { BlogPost } from "../lib/content";
import { getReadingTimeMinutes } from "../lib/blogPresentation";
import { loadBlogPosts } from "../lib/contentApi";
import "../styles/blog.css";

function formattedDate(value?: string): string {
  if (!value) return "Date not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not available"
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let isMounted = true;
    void loadBlogPosts().then((items) => {
      if (isMounted) {
        setBlogPosts(items);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(blogPosts.map((post) => post.category.trim()).filter(Boolean))],
    [blogPosts],
  );
  const visiblePosts = useMemo(
    () =>
      activeCategory === "All"
        ? blogPosts
        : blogPosts.filter((post) => post.category === activeCategory),
    [activeCategory, blogPosts],
  );

  return (
    <section className="pg page">
      <div className="container">
        <div className="pg-head">
          <span className="pg-kicker">ShuzhFit</span>
          <h1>Blog</h1>
          <p className="pg-intro">
            Practical coaching notes, mindset guidance, and simple lessons that
            keep training sustainable.
          </p>
        </div>

        {!isLoading && blogPosts.length > 0 && (
          <nav className="blog-filters" aria-label="Filter articles by category">
            {categories.map((category) => (
              <button
                key={category}
                className={`blog-filter${activeCategory === category ? " is-active" : ""}`}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>
        )}

        {isLoading ? (
          <p className="empty-state">Loading articles...</p>
        ) : visiblePosts.length === 0 ? (
          <p className="empty-state">No articles are available right now.</p>
        ) : (
          <div className="blog-grid">
            {visiblePosts.map((post) => (
              <Link key={post.slug} className="blog-card" to={`/blog/${post.slug}`}>
                {post.coverImage ? (
                  <img
                    className="blog-card-image"
                    src={post.coverImage}
                    alt=""
                    width="1200"
                    height="675"
                    loading="lazy"
                  />
                ) : (
                  <div className="blog-card-image blog-card-placeholder" aria-hidden="true">
                    <span>{post.category}</span>
                  </div>
                )}
                <div className="blog-card-body">
                  <span className="blog-category-chip">{post.category}</span>
                  <h2>{post.title}</h2>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <div className="blog-card-meta">
                    <time dateTime={post.publishedAt ?? undefined}>{formattedDate(post.publishedAt ?? undefined)}</time>
                    <span>{getReadingTimeMinutes(post.content)} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
