import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

// Protocol-level load: 10 virtual users for 20 seconds against the health endpoint.
// Thresholds turn the run into a pass/fail gate instead of a chart to interpret.
export const options = {
  vus: 10,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<250'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export default function () {
  const response = http.get(`${baseUrl}/api/health`);
  check(response, {
    'health returns 200': (r) => r.status === 200,
  });
  sleep(0.2);
}

// Human-readable summary on stdout plus a machine-readable file for CI artifacts.
export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'k6-summary.json': JSON.stringify(data, null, 2),
  };
}
