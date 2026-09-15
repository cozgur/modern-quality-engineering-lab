// Assembles the Pages landing page from pages/index.html and the evidence CI collected.
// Every number comes from a real artifact of this run or of the latest run of a sibling
// workflow; when something is missing the page says so instead of inventing a value.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const siteDir = process.argv[2] ?? 'site';
const evidenceDir = process.argv[3] ?? 'evidence';
const env = process.env;
const template = readFileSync('pages/index.html', 'utf8');

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null);
const runLink = env.GITHUB_RUN_ID
  ? `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
  : 'https://github.com/cozgur/modern-quality-engineering-lab/actions';

function mutation() {
  const report = readJson(`${siteDir}/mutation/mutation.json`);
  if (!report) return null;
  let detected = 0;
  let undetected = 0;
  for (const file of Object.values(report.files)) {
    for (const m of file.mutants) {
      if (m.status === 'Killed' || m.status === 'Timeout') detected += 1;
      else if (m.status === 'Survived' || m.status === 'NoCoverage') undetected += 1;
    }
  }
  const total = detected + undetected;
  return total ? { score: (detected / total) * 100, detected, total } : null;
}

function coverage() {
  const summary = readJson(`${evidenceDir}/coverage/coverage-summary.json`);
  return summary?.total ?? null;
}

function playwright() {
  const results = readJson(`${siteDir}/report/results.json`);
  return results?.stats ?? null;
}

function k6() {
  const summary = readJson(`${siteDir}/perf/k6-summary.json`);
  if (!summary) return null;
  const { metrics } = summary;
  const thresholds = { ...metrics.http_req_duration.thresholds, ...metrics.http_req_failed.thresholds };
  return {
    requests: metrics.http_reqs.values.count,
    p95: metrics.http_req_duration.values['p(95)'],
    failedRate: metrics.http_req_failed.values.rate,
    met: Object.values(thresholds).every((t) => t.ok),
  };
}

function promptfoo() {
  const data = readJson(`${siteDir}/ai-eval/promptfoo-results.json`);
  if (!data) return null;
  const stats = data.results?.stats ?? data.stats ?? {};
  const provider =
    data.results?.prompts?.[0]?.provider ?? data.config?.providers?.[0]?.id ?? data.config?.providers?.[0];
  return { passed: stats.successes ?? 0, failed: stats.failures ?? 0, provider };
}

function spans() {
  const file = `${siteDir}/traces/spans.txt`;
  return existsSync(file) ? (readFileSync(file, 'utf8').match(/traceId/g) ?? []).length : null;
}

const mut = mutation();
const cov = coverage();
const pwStats = playwright();
const perf = k6();
const ai = promptfoo();
const spanCount = spans();

const fmt = (n, digits = 2) => n.toLocaleString('en-US', { maximumFractionDigits: digits });
const row = (signal, value, note = '') =>
  `<tr><th scope="row">${signal}</th><td class="v">${value}</td><td class="n">${note}</td></tr>`;

const metrics = [
  row(
    'CI',
    `<span class="ok">✓ passing</span>`,
    `every gate green in <a href="${runLink}">run #${env.GITHUB_RUN_NUMBER ?? '?'}</a>`,
  ),
  row(
    'Mutation score',
    mut ? `<span class="${mut.score >= 80 ? 'ok' : 'bad'}">${fmt(mut.score, 1)}%</span>` : 'n/a',
    mut ? `${mut.detected} of ${mut.total} injected faults caught · CI breaks under 80%` : 'report missing',
  ),
  row(
    'Coverage',
    cov ? `${fmt(cov.lines.pct, 1)}% lines · ${fmt(cov.branches.pct, 1)}% branches` : 'n/a',
    cov ? 'thresholds enforced: 90% lines, 85% branches' : 'summary missing',
  ),
  row(
    'E2E + accessibility',
    pwStats
      ? `<span class="${pwStats.unexpected === 0 ? 'ok' : 'bad'}">${pwStats.expected} passed · ${pwStats.unexpected} failed</span>`
      : 'n/a',
    pwStats ? `${pwStats.flaky} flaky · Chromium · axe WCAG A/AA` : 'results missing',
  ),
  row(
    'Performance',
    perf
      ? `<span class="${perf.met ? 'ok' : 'bad'}">p95 ${fmt(perf.p95)} ms · ${fmt(perf.failedRate * 100)}% errors</span>`
      : 'not run yet',
    perf
      ? `${fmt(perf.requests, 0)} requests · CI-local workload, indicative, not a production benchmark`
      : 'dispatch the performance workflow',
  ),
  row(
    'AI evaluation',
    ai
      ? `<span class="${ai.failed === 0 ? 'ok' : 'bad'}">${ai.passed}/${ai.passed + ai.failed} passed</span>`
      : 'not run yet',
    ai
      ? `deterministic assertions · ${ai.provider ?? 'model'}`
      : 'needs an ANTHROPIC_API_KEY or OPENAI_API_KEY secret',
  ),
].join('\n            ');

const k6Summary = perf
  ? `${fmt(perf.requests, 0)} requests · p95 ${fmt(perf.p95)} ms · ${fmt(perf.failedRate * 100)}% failed · thresholds ${perf.met ? 'met' : 'breached'}${env.PERF_RUN ? ` · run #${env.PERF_RUN} on ${env.PERF_DATE}` : ''} · CI-local workload, indicative, not a production benchmark`
  : 'No performance run published yet. Dispatch the performance workflow.';
const aiSummary = ai
  ? `${ai.passed} assertions passed · ${ai.failed} failed${ai.provider ? ` · ${ai.provider}` : ''}${env.AI_RUN ? ` · run #${env.AI_RUN} on ${env.AI_DATE}` : ''}`
  : 'Not run yet: add an ANTHROPIC_API_KEY or OPENAI_API_KEY repository secret and dispatch the ai-eval workflow.';
const otelSummary =
  spanCount === null
    ? 'No trace captured in this run.'
    : `${spanCount} spans exported by Node auto-instrumentation for three requests (health, checkout, order lookup)`;

const html = template
  .replaceAll('{{sha}}', (env.GITHUB_SHA ?? 'local').slice(0, 7))
  .replaceAll('{{date}}', new Date().toISOString().slice(0, 10))
  .replaceAll('{{run}}', `#${env.GITHUB_RUN_NUMBER ?? '0'}`)
  .replaceAll('{{metrics}}', metrics)
  .replaceAll('{{k6_summary}}', k6Summary)
  .replaceAll('{{ai_summary}}', aiSummary)
  .replaceAll('{{otel_summary}}', otelSummary);

writeFileSync(`${siteDir}/index.html`, html);
console.log('assembled', `${siteDir}/index.html`);
