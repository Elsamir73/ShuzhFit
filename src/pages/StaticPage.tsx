type StaticPageItem = {
  title: string;
  body: string;
  meta?: string;
};

type StaticPageProps = {
  title: string;
  description: string;
  items?: StaticPageItem[];
};

export function StaticPage({
  title,
  description,
  items = [],
}: StaticPageProps) {
  return (
    <section className="pg page">
      <div className="container">
        <div className="pg-head">
          <span className="pg-kicker">ShuzhFit</span>
          <h1>{title}</h1>
          <p className="pg-intro">{description}</p>
        </div>

        {items.length > 0 ? (
          <div className="feature-grid" aria-label={`${title} overview`}>
            {items.map((item) => (
              <article key={item.title} className="feature-card">
                {item.meta ? (
                  <span className="feature-meta">{item.meta}</span>
                ) : null}
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
