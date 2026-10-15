import { afterEach, describe, expect, it, vi } from "vitest";

const valid = {
  verdict: "WARNING", score: 50, summary_th: "s", summary_en: "s", recommendation_th: "r", recommendation_en: "r",
  evidence: [], tiers: [{ tier: "T0", status: "ok" }], policy_version: "1", rules_version: "1", model_version: "1", checked_at: "2026-01-01T00:00:00Z", latency_ms: 5,
};

async function load() {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  return import("@/lib/api");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("checkDestination (live mode)", () => {
  it("sends only chain_id and destination", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(valid), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { checkDestination } = await load();
    const out = await checkDestination(43113, "0x1111111111111111111111111111111111111111");
    expect(out.demo).toBe(false);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(body).sort()).toEqual(["chain_id", "destination"]);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/v1/check");
  });
  it("rejects responses that fail schema validation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ verdict: "SAFE" }), { status: 200 })));
    const { checkDestination } = await load();
    await expect(checkDestination(1, "0x1111111111111111111111111111111111111111")).rejects.toMatchObject({ kind: "invalid_response" });
  });
  it("retries once on server error then succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("", { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify(valid), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { checkDestination } = await load();
    await expect(checkDestination(1, "0x1111111111111111111111111111111111111111")).resolves.toMatchObject({ demo: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("reports network failure after retries", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { checkDestination } = await load();
    await expect(checkDestination(1, "0x1111111111111111111111111111111111111111")).rejects.toMatchObject({ kind: "network" });
  });
});
