// k6 run -e BASE_URL=https://automationexercise.com tests/load.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  scenarios: {
    ramped: {
      executor: 'ramping-arrival-rate',
      startRate: 1,           // warm-up suave
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { target: 5, duration: '30s' },  // sube a 5 req/s
        { target: 5, duration: '30s' },  // meseta corta
        { target: 0, duration: '10s' },  // ramp down
      ],
      gracefulStop: '10s',
    },
  },
  thresholds: {
    // Agregadas (opcionales)
    'http_req_failed': ['rate<0.01'],
    'http_req_duration{type:auth}':   ['p(99)<800'],
    'http_req_duration{type:detail}': ['p(99)<800'],

    // Específicas por endpoint de catálogo (recomendado)
    'http_req_duration{url:/api/productsList}': ['p(95)<500', 'p(99)<900'],
    'http_req_duration{url:/api/brandsList}':   ['p(95)<500', 'p(99)<900'],
    'http_req_duration{url:/api/searchProduct}':['p(95)<550', 'p(99)<950'],
  },
  summaryTrendStats: ['avg','min','med','p(90)','p(95)','p(99)','max'],
};

const BASE = __ENV.BASE_URL || 'https://automationexercise.com';

export default function () {
  // auth (ejemplo)
  const login = http.post(`${BASE}/api/verifyLogin`,
    { email: 'test@example.com', password: 'x' },
    { tags: { type: 'auth' } }
  );
  check(login, { 'login 200': r => r.status === 200 });

  // catálogo – separadas por URL para métricas finas
  const list = http.get(`${BASE}/api/productsList`, { tags: { type: 'catalog' } });
  check(list, { 'list 200': r => r.status === 200 });

  const brands = http.get(`${BASE}/api/brandsList`, { tags: { type: 'catalog' } });
  check(brands, { 'brands 200': r => r.status === 200 });

  const search = http.post(`${BASE}/api/searchProduct`,
    { search_product: 'top' },
    { tags: { type: 'catalog' } }
  );
  check(search, { 'search 200': r => r.status === 200 });

  // detalle
  const detail = http.get(`${BASE}/product_details/1`, { tags: { type: 'detail' } });
  check(detail, { 'detail 200': r => r.status === 200 });

  // think time realista
  sleep(1);
}
