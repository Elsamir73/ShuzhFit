import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export function AdminPage() {
  return (
    <>
      <Helmet>
        <title>Admin</title>
        <meta
          name="description"
          content="Administrative dashboard for managing exercises, blogs, videos, and community messages."
        />
      </Helmet>

      <section className="pg page">
        <div className="container">
          <div className="pg-head" style={{ marginBottom: 28 }}>
            <span className="pg-kicker">Admin</span>
            <h1>Content dashboard</h1>
            <p className="pg-intro">
              Manage the public fitness library, blog content, and community
              messaging from this admin console.
            </p>
          </div>

          <div className="admin-metrics-grid">
            {[
              { title: "Exercises", path: "/admin/exercises", value: "42" },
              { title: "Blog posts", path: "/admin/blogs", value: "18" },
              { title: "Videos", path: "/admin/videos", value: "24" },
              { title: "Comments", path: "/admin/comments", value: "5" },
              { title: "Messages", path: "/admin/messages", value: "9" },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className="admin-metric-card"
              >
                <p>{item.title}</p>
                <h3>{item.value}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
