// Assembles the Pages landing page from pages/index.html and the evidence CI collected.
// Every value here comes from a real artifact; when one is missing the page says so.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const outDir = process.argv[2] ?? 'site';
const env = process.env;
const template = readFileSync('pages/index.html', 'utf8');

function performance() {
  const file = `${outDir}/perf/k6-summary.json`;
  if (!existsSync(file)) return 'No performance run published yet. Dispatch the performance workflow.';
  const { metrics } = JSON.parse(readFileSync(file, 'utf8'));
  const duration = metrics.http_req_duration.values;
  const failed = metrics.http_req_failed.values;
  const requests = metrics.http_reqs.values.count;
  const thresholds = { ...metrics.http_req_duration.thresholds, ...metrics.http_req_failed.thresholds };
  const met = Object.values(thresholds).every((t) => t.ok);
  const when = env.PERF_RUN ? ` · run #${env.PERF_RUN} on ${env.PERF_DATE}` : '';
  return `${requests.toLocaleString('en-US')} requests · p95 ${duration['p(95)'].toFixed(2)} ms · ${(failed.rate * 100).toFixed(2)}% failed · thresholds ${met ? 'met' : 'breached'}${when}`;
}

function aiEvaluation() {
  const file = `${outDir}/ai-eval/promptfoo-results.json`;
  if (!existsSync(file))
    return 'Not run yet: add an ANTHROPIC_API_KEY repository secret and dispatch the ai-eval workflow.';
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const stats = data.results?.stats ?? data.stats ?? {};
  const when = env.AI_RUN ? ` · run #${env.AI_RUN} on ${env.AI_DATE}` : '';
  return `${stats.successes ?? '?'} assertions passed · ${stats.failures ?? '?'} failed${when}`;
}

function observability() {
  const file = `${outDir}/traces/spans.txt`;
  if (!existsSync(file)) return 'No trace captured in this run.';
  const spans = (readFileSync(file, 'utf8').match(/traceId/g) ?? []).length;
  return `${spans} spans exported by Node auto-instrumentation for three requests (health, checkout, order lookup)`;
}

const html = template
  .replaceAll('{{sha}}', (env.GITHUB_SHA ?? 'local').slice(0, 7))
  .replaceAll('{{date}}', new Date().toISOString().slice(0, 10))
  .replaceAll('{{run}}', `#${env.GITHUB_RUN_NUMBER ?? '0'}`)
  .replaceAll('{{k6_summary}}', performance())
  .replaceAll('{{ai_summary}}', aiEvaluation())
  .replaceAll('{{otel_summary}}', observability());

writeFileSync(`${outDir}/index.html`, html);
console.log('assembled', `${outDir}/index.html`);
