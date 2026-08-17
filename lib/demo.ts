/**
 * Live demo services hosted outside Vercel.
 *
 * The warehouse automation demo runs as a container on AWS, not here. Its URL
 * is injected at build time so the site has no hardcoded dependency on where
 * that service lives.
 *
 * Set NEXT_PUBLIC_WAREHOUSE_DEMO_URL in the Vercel project (all environments)
 * once the AWS service is up — e.g. https://warehouse.d7tech.net
 *
 * Deliberately blank by default: with no value set, `getDemoUrl` returns null
 * and callers render nothing, so the page is correct before the demo exists.
 * NEXT_PUBLIC_ vars are inlined at build time, so changing it needs a redeploy.
 */

const DEMO_URLS: Record<string, string | undefined> = {
  'warehouse-automation': process.env.NEXT_PUBLIC_WAREHOUSE_DEMO_URL,
};

/** Returns a usable https URL for the project's live demo, or null. */
export function getDemoUrl(slug: string): string | null {
  const raw = DEMO_URLS[slug]?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    // Only ever link out over https — an http link would be a mixed-content
    // warning on an https page, and the demo terminates TLS at App Runner.
    if (url.protocol !== 'https:') return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    // A malformed value should not break the build or the page.
    return null;
  }
}
