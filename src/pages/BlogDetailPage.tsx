import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import type { BlogPost } from "../lib/content";
import { loadBlogPost } from "../lib/contentApi";
import { ContentEngagement } from "../components/ContentEngagement";

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let live = true; setError(""); void loadBlogPost(slug).then((item) => { if (live) { setPost(item); if (!item) setError("Article not found."); } }).catch(() => { if (live) setError("We couldn't load this article. Please try again."); }); return () => { live = false; }; }, [slug]);
  if (!post) return <section className="pg page"><div className="container"><p role={error ? "alert" : "status"}>{error || "Loading article…"}</p><Link to="/blog">Back to blog</Link></div></section>;
  return <><Helmet><title>{post.seoTitle || post.title} | ShuzhFit</title><meta name="description" content={post.seoDescription || post.excerpt}/></Helmet><section className="pg page"><div className="container"><div className="pg-head"><Link to="/blog" className="pg-back">← Back to blog</Link><span className="pg-kicker">{post.category}</span><h1>{post.title}</h1><p className="pg-intro">{post.excerpt} · By {post.author}</p></div>{post.coverImage ? <img className="blog-cover" src={post.coverImage} alt={post.title} width="1200" height="675" loading="lazy"/> : null}<article className="blog-article card">{post.contentFormat === "markdown" ? <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{post.content}</ReactMarkdown> : <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}/>}</article><ContentEngagement type="blog" slug={slug}/></div></section></>;
}
