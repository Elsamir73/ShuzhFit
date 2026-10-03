import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type BlogPost } from "../lib/content";
import { loadBlogPosts } from "../lib/contentApi";

export function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        <div className="content-grid">
          {isLoading ? (
            <p className="empty-state">Loading articles...</p>
          ) : blogPosts.length === 0 ? (
            <p className="empty-state">No articles are available right now.</p>
          ) : (
            blogPosts.map((post) => (
              <Link
                key={post.slug}
                className="content-card card"
                to={`/blog/${post.slug}`}
              >
                <span className="content-meta">{post.category}</span>
                <h3>{post.title}</h3>
                <p className="content-summary">{post.excerpt}</p>
                <span className="content-link">Read article →</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
