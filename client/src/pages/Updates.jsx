// News from the field: the list at /updates and a single update at /updates/:slug.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import { Tag, Button } from '../components/ui.jsx';
import { api, fmtDate } from '../lib/api.js';
import { donateOptions } from '../data/site.js';

const label = (k) => donateOptions.find((o) => o.key === k)?.label;

export function UpdateCards({ posts }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <Link
          key={p._id}
          to={`/updates/${p.slug}`}
          data-reveal
          data-cursor="Read"
          className="group flex flex-col justify-between gap-8 rounded-[22px] border border-rule p-7 transition-[border-color,translate] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
        >
          <div>
            <p className="text-sm text-muted">{fmtDate(p.publishedAt)}</p>
            <h3 className="mt-3 text-2xl">{p.title}</h3>
            {p.summary && <p className="mt-2 text-muted">{p.summary}</p>}
          </div>
          <div className="flex items-center justify-between">
            {p.programme ? <Tag>{label(p.programme)}</Tag> : <span />}
            <ArrowUpRight
              aria-hidden
              className="size-5 transition-transform duration-500 group-hover:rotate-45"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Updates() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => {
    api(slug ? `/posts/${slug}` : '/posts').then(setData, (e) => setData({ error: e.message }));
  }, [slug]);

  if (slug) {
    const p = data?.post;
    return (
      <Page title={p?.title ?? 'Update'} description={p?.summary}>
        <PageHero
          label={p ? `Update · ${fmtDate(p.publishedAt)}` : 'Update'}
          lines={[p?.title ?? (data?.error ? 'Not found.' : '…')]}
          intro={p?.summary}
        />
        {p && (
          <section className="border-t border-rule py-20">
            <article className="container-x max-w-[44rem]">
              {p.body.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="mt-5 whitespace-pre-line leading-[1.75] text-muted first:mt-0">
                  {para}
                </p>
              ))}
              <div className="mt-10 flex flex-wrap gap-3">
                {p.link && (
                  <Button href={p.link} target="_blank" rel="noopener noreferrer" variant="outline">
                    More <span className="sr-only">(opens in a new tab)</span>
                  </Button>
                )}
                <Button to={`/donate${p.programme ? `?programme=${p.programme}` : ''}`} variant="accent">
                  Support this work
                </Button>
              </div>
            </article>
          </section>
        )}
      </Page>
    );
  }
  return (
    <Page
      title="Updates"
      description="News from Pirento Foundation's programmes in Basti and eastern Uttar Pradesh."
    >
      <PageHero
        label="Updates"
        lines={['From the field.']}
        intro="What we planted, delivered and learned, posted by our team."
      />
      <section className="border-t border-rule py-20 md:py-28">
        <div className="container-x">
          {data?.posts?.length === 0 && (
            <p className="text-muted">No updates yet. The first one is coming soon.</p>
          )}
          {data?.posts?.length > 0 && <UpdateCards posts={data.posts} />}
        </div>
      </section>
    </Page>
  );
}
