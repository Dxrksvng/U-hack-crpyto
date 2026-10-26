import { afterEach, describe, expect, it, vi } from "vitest";
import { UserInputEventType } from "@metamask/snaps-sdk";
import { assertJSXElement } from "@metamask/snaps-sdk/jsx";
import { is } from "@metamask/superstruct";
import { JsonStruct } from "@metamask/utils";
import { onTransaction, onUserInput } from "../src/index";
import { MockRiskProvider, DEMO_ADDRESSES } from "../src/risk/mockProvider";
import { decodeContext, encodeContext, InteractiveInsight, type InsightContext } from "../src/ui/interactive";

const tx = (to: string) => ({ from: "0x0000000000000000000000000000000000000001", to, nonce: "0x0", value: "0x1", data: "0x", gas: "0x5208", maxFeePerGas: "0x1", maxPriorityFeePerGas: "0x1", estimateSuggested: "0x1", estimateUsed: "0x1" });
function runtime() {
  const request = vi.fn().mockResolvedValue("interface-id");
  vi.stubGlobal("snap", { request });
  return request;
}
async function fixture(recipient: string): Promise<InsightContext> {
  return { recipient, chainId: "eip155:11155111", result: await new MockRiskProvider().analyze({ recipient, chainId: "eip155:11155111" }), view: "warning", question: "", answer: "" };
}
afterEach(() => vi.unstubAllGlobals());

describe("native interactive transaction insight", () => {
  it.each([...Object.values(DEMO_ADDRESSES), "0x1234567890123456789012345678901234567890"])("creates a JSON-safe interface for %s with the real recipient", async recipient => {
    const request = runtime();
    const response = await onTransaction({ transaction: tx(recipient), chainId: "eip155:11155111" });
    expect(response).toEqual(recipient === DEMO_ADDRESSES.CRITICAL ? { id: "interface-id", severity: "critical" } : { id: "interface-id" });
    expect(request).toHaveBeenCalledTimes(1);
    const call = request.mock.calls[0]?.[0];
    expect(call.method).toBe("snap_createInterface");
    assertJSXElement(call.params.ui);
    expect(is(call.params, JsonStruct)).toBe(true);
    expect(decodeContext(call.params.context)?.recipient).toBe(recipient);
    const json = JSON.stringify(call.params.ui);
    expect(json.indexOf('"type":"Banner"')).toBeLessThan(json.indexOf('"type":"Image"'));
    expect(json).toContain("DEMO");
    expect(json).not.toContain('"name":"cancel"');
  });

  it("navigates all three views and answers questions without crossing confirmation contexts", async () => {
    const request = runtime();
    for (const recipient of [DEMO_ADDRESSES.CRITICAL, DEMO_ADDRESSES.WARNING]) {
      let context = await fixture(recipient);
      for (const name of ["analysis", "details", "analysis", "why", "continue-info", "verify", "warning"]) {
        await onUserInput({ id: recipient, context: encodeContext(context), event: { type: UserInputEventType.ButtonClickEvent, name } });
        const call = request.mock.lastCall?.[0];
        expect(call.method).toBe("snap_updateInterface");
        expect(call.params.id).toBe(recipient);
        assertJSXElement(call.params.ui);
        expect(is(call.params, JsonStruct)).toBe(true);
        const decoded = decodeContext(call.params.context);
        expect(decoded?.recipient).toBe(recipient);
        if (!decoded) throw new Error("missing interface context");
        context = decoded;
        if (name === "why") expect(context.answer).toContain(recipient === DEMO_ADDRESSES.CRITICAL ? "Demo sanctions list" : "Demo graph fixture");
      }
    }
  });

  it("has a real SVG gauge only for provider numeric scores", async () => {
    const critical = await fixture(DEMO_ADDRESSES.CRITICAL);
    const json = JSON.stringify(InteractiveInsight({ context: { ...critical, view: "details" } }));
    expect(json).toContain("92 / 100 risk signal score");
    expect(json).toContain("stroke-dashoffset");
    const neutral = await fixture(DEMO_ADDRESSES.NO_KNOWN_RISK);
    expect(JSON.stringify(InteractiveInsight({ context: { ...neutral, view: "details" } }))).toContain("Score not available");
    for (const view of ["warning", "analysis", "details"] as const) assertJSXElement(InteractiveInsight({ context: { ...critical, view } }));
  });

  it("supports bounded typed questions, no fabricated cases or LLM", async () => {
    const request = runtime();
    const context = encodeContext(await fixture(DEMO_ADDRESSES.CRITICAL));
    for (const [question, answer] of [["Show similar cases", "No verified case data"], ["Is the owner Bob?", "cannot verify"], ["Why is this risky?", "DEMO fixtures only"]] as const) {
      await onUserInput({ id: "critical", context, event: { type: UserInputEventType.FormSubmitEvent, name: "consult", value: { question } } });
      const updated = decodeContext(request.mock.lastCall?.[0].params.context);
      expect(updated?.answer).toContain(answer);
      expect(updated?.view).toBe("analysis");
    }
    const calls = request.mock.calls.length;
    await onUserInput({ id: "critical", context, event: { type: UserInputEventType.FormSubmitEvent, name: "consult", value: { question: "  " } } });
    await onUserInput({ id: "critical", context, event: { type: UserInputEventType.ButtonClickEvent, name: "approve-transaction" } });
    await onUserInput({ id: "critical", context: { payload: "invalid" }, event: { type: UserInputEventType.ButtonClickEvent, name: "analysis" } });
    expect(request).toHaveBeenCalledTimes(calls);
  });

  it("keeps a complete static fallback when interface creation fails", async () => {
    const request = runtime();
    request.mockRejectedValueOnce(new Error("unsupported"));
    const response = await onTransaction({ transaction: tx(DEMO_ADDRESSES.CRITICAL), chainId: "eip155:11155111" });
    expect(response).toHaveProperty("content");
    expect(response).toHaveProperty("severity", "critical");
  });
});
