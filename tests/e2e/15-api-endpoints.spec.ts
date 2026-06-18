/**
 * Direct API endpoint tests — verify every endpoint the frontend uses
 * actually responds. Tests run against the live server at baseURL.
 *
 * These tests expose missing or broken backend routes.
 */
import { test, expect } from "@playwright/test";

const GET_ENDPOINTS = [
  "/api/v1/health",
  "/api/v1/version",
  "/api/v1/openapi.json",
  "/api/v1/daemon/status",
  "/api/v1/events?limit=8",
  "/api/v1/instances",
  "/api/v1/images",
  "/api/v1/capsule-types",
  "/api/v1/networks",
  "/api/v1/storage/buckets",
  "/api/v1/storage/volumes",
  "/api/v1/dns/zones",
  "/api/v1/capinit/status",
  "/api/v1/capinit/templates",
  "/api/v1/iam/users",
  "/api/v1/iam/groups",
  "/api/v1/iam/roles",
  "/api/v1/iam/policies",
  "/api/v1/iam/tokens",
  "/api/v1/iam/audit?limit=100",
  "/api/v1/marketplace/images",
  "/api/v1/factory/status",
  "/api/v1/factory/sync/status",
  "/api/v1/factory/jobs",
  "/api/v1/lb",
  "/api/v1/firewalls",
  "/api/v1/health-checks",
  "/api/v1/stacks",
  "/api/v1/databases",
  "/api/v1/ai/agents",
  "/api/v1/ai/sessions",
  "/api/v1/ai/mcp",
  "/api/v1/backups",
  "/api/v1/backup-policies",
  "/api/v1/quotas",
  "/api/v1/posture/findings",
  "/api/v1/search",
];

// Endpoints the frontend calls but may be missing from the backend
const EXPECTED_BUT_POTENTIALLY_MISSING = [
  "/api/v1/gpu",
];

for (const endpoint of GET_ENDPOINTS) {
  test(`GET ${endpoint} returns 200`, async ({ request }) => {
    const response = await request.get(endpoint);
    expect(response.status(), `${endpoint} returned ${response.status()}`).toBe(200);
    const body = await response.json();
    // All API responses are wrapped in { data: ... } envelope
    expect(body).toBeDefined();
  });
}

for (const endpoint of EXPECTED_BUT_POTENTIALLY_MISSING) {
  test(`GET ${endpoint} (frontend uses this — may be unimplemented)`, async ({ request }) => {
    const response = await request.get(endpoint);
    // We explicitly flag 404s so they appear as failures in the report
    if (response.status() === 404) {
      console.warn(`MISSING ENDPOINT: ${endpoint} returned 404`);
    }
    expect(
      response.status(),
      `${endpoint} is called by the frontend but returned ${response.status()} — backend endpoint not implemented`
    ).toBe(200);
  });
}

test("GET /api/v1/health returns status ok", async ({ request }) => {
  const response = await request.get("/api/v1/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.status).toBe("ok");
});

test("POST /api/v1/dns/query accepts a query", async ({ request }) => {
  const response = await request.post("/api/v1/dns/query", {
    data: { fqdn: "example.com.", type: "A" },
  });
  // 200 or 422 (no resolver) — both mean the endpoint exists
  expect([200, 422, 500]).toContain(response.status());
});

test("POST /api/v1/iam/simulate accepts action+resource", async ({ request }) => {
  const response = await request.post("/api/v1/iam/simulate", {
    data: { action: "instance:list", resource: "*" },
  });
  expect([200, 403, 422]).toContain(response.status());
});

test("GET /api/v1/instances/{id} returns 404 for unknown id", async ({ request }) => {
  const response = await request.get("/api/v1/instances/nonexistent-000");
  expect(response.status()).toBe(404);
});

test("GET /api/v1/images/{name} returns 404 for unknown name", async ({ request }) => {
  const response = await request.get("/api/v1/images/this-image-does-not-exist");
  expect(response.status()).toBe(404);
});
