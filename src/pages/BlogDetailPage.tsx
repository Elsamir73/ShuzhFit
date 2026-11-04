import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import type { BlogPost } from "../lib/content";
import { pickRelatedPosts } from "../lib/blogPresentation";
import { loadBlogPost, loadBlogPosts } from "../lib/contentApi";
import { ContentEngagement } from "../components/ContentEngagement";
import "../styles/blog.css";

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setError("");
    setPost(null);
    void Promise.all([loadBlogPost(slug), loadBlogPosts()]).then(([item, items]) => {
      if (live) {
        setPost(item);
        setBlogPosts(items);
        if (!item) setError("Article not found.");
      }
    }).catch(() => {
      if (live) setError("We couldn't load this article. Please try again.");
    });
    return () => {
      live = false;
    };
  }, [slug]);

  const relatedPosts = useMemo(
    () => (post ? pickRelatedPosts(post, blogPosts) : []),
    [blogPosts, post],
  );

  if (!post) {
    return (
      <section className="pg page">
        <div className="container">
          <p role={error ? "alert" : "status"}>{error || "Loading article…"}</p>
          <Link to="/blog">Back to blog</Link>
        </div>
      </section>
    );
  }

  const featuredPost = relatedPosts[0];
  const compactPosts = relatedPosts.slice(1, 5);

  return (
    <>
      <Helmet>
        <title>{post.seoTitle || post.title} | ShuzhFit</title>
        <meta name="description" content={post.seoDescription || post.excerpt} />
      </Helmet>
      <section className="pg page">
        <div className="container">
          <div className="pg-head blog-post-head">
            <Link to="/blog" className="pg-back">← Back to blog</Link>
            <span className="pg-kicker">{post.category}</span>
            <h1>{post.title}</h1>
            <p className="pg-intro">{post.excerpt} · By {post.author}</p>
          </div>
          {post.coverImage ? (
            <img
              className="blog-cover"
              src={post.coverImage}
              alt={post.title}
              width="1200"
              height="675"
              loading="lazy"
            />
          ) : null}
          <article className="blog-article card">
            {post.contentFormat === "markdown" ? (
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{post.content}</ReactMarkdown>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
            )}
          </article>
          <ContentEngagement type="blog" slug={slug} />

          {featuredPost && (
            <section className="blog-read-next" aria-labelledby="blog-read-next-title">
              <div className="blog-read-next-heading">
                <span className="pg-kicker">Keep learning</span>
                <h2 id="blog-read-next-title">Read next</h2>
              </div>
              <div className="blog-related-layout">
                <Link className="blog-related-featured" to={`/blog/${featuredPost.slug}`}>
                  {featuredPost.coverImage ? (
                    <img
                      src={featuredPost.coverImage}
                      alt=""
                      width="1200"
                      height="675"
                      loading="lazy"
                    />
                  ) : (
                    <div className="blog-related-placeholder" aria-hidden="true">
                      <span>{featuredPost.category}</span>
                    </div>
                  )}
                  <div className="blog-related-featured-copy">
                    <span className="blog-category-chip">{featuredPost.category}</span>
                    <h3>{featuredPost.title}</h3>
                    <p>{featuredPost.excerpt}</p>
                    <span className="blog-related-author">By Samir Pathak</span>
                  </div>
                </Link>
                {compactPosts.length > 0 && (
                  <div className="blog-related-list">
                    {compactPosts.map((related) => (
                      <Link
                        key={related.slug}
                        className="blog-related-row"
                        to={`/blog/${related.slug}`}
                      >
                        {related.coverImage ? (
                          <img
                            src={related.coverImage}
                            alt=""
                            width="240"
                            height="135"
                            loading="lazy"
                          />
                        ) : (
                          <div className="blog-related-thumb-placeholder" aria-hidden="true" />
                        )}
                        <span className="blog-related-row-copy">
                          <strong>{related.title}</strong>
                          <span>{related.excerpt}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </>
  );
}
