import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Search, Download, BadgeCheck, BadgeX } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import { CertificateArt } from '../components/Art.jsx';
import { Button, Notice } from '../components/ui.jsx';
import { api, fmtDate, pdfUrl } from '../lib/api.js';

export default function Verify() {
  const { certNo } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(certNo ?? '');
  const [res, setRes] = useState({ loading: false });

  useEffect(() => {
    if (!certNo) return setRes({ loading: false });
    setRes({ loading: true });
    api(`/certificates/verify/${encodeURIComponent(certNo)}`).then(
      (d) => setRes({ cert: d.certificate }),
      (e) => setRes({ error: e.message }),
    );
  }, [certNo]);

  const c = res.cert;
  return (
    <Page title="Verify a certificate" description="Check that a Pirento Foundation certificate is genuine and still valid.">
      <PageHero label="Verify" lines={['Is this certificate', 'real? Check here.']} intro="Every certificate we issue carries a number like PFC-1A2B3C4D5E6F7A8B. Enter it below to see who it was issued to and whether it is still valid." />
      <section className="border-t border-rule py-24 md:py-32">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = q.trim().toUpperCase();
                if (n) navigate(`/verify/${n}`);
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="certno" className="sr-only">Certificate number</label>
              <input id="certno" className="input flex-1 font-mono uppercase" value={q} onChange={(e) => setQ(e.target.value)} placeholder="PFC-…" autoComplete="off" spellCheck="false" />
              <Button type="submit" icon={Search}>Verify</Button>
            </form>
            <div className="mt-8" aria-live="polite">
              {res.loading && <p className="text-muted">Checking…</p>}
              {res.error && <Notice kind="error">{res.error}</Notice>}
              {c && (
                <div className={`rounded-[22px] border p-7 ${c.revoked ? 'border-ink' : 'border-accent'}`}>
                  <p className="flex items-center gap-2 font-medium">
                    {c.revoked ? <BadgeX aria-hidden className="size-5" /> : <BadgeCheck aria-hidden className="size-5" />}
                    {c.revoked ? 'Revoked: this certificate is no longer valid.' : 'Valid certificate issued by Pirento Foundation.'}
                  </p>
                  <dl className="mt-6 grid gap-3 text-sm">
                    {[['Issued to', c.recipientName], ['Title', c.title], ['Type', c.kind], ['Issued on', fmtDate(c.issuedAt)], ['Number', c.certNo]].map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 border-t border-rule pt-3">
                        <dt className="text-muted">{k}</dt>
                        <dd className="break-all">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {!c.revoked && (
                    <Button href={pdfUrl(c.certNo)} target="_blank" rel="noopener noreferrer" variant="outline" icon={Download} className="mt-6">
                      View certificate (PDF, opens in a new tab)
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div data-reveal className="overflow-hidden rounded-[22px] border border-rule lg:col-span-5 lg:col-start-8">
            <CertificateArt />
          </div>
        </div>
      </section>
    </Page>
  );
}
