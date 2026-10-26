import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VerdictCard } from "@/components/VerdictCard";
import { PreSendAlertSheet } from "@/components/PreSendAlertSheet";
import { TransactionSuccess } from "@/components/TransactionSuccess";
import { deriveSteps } from "@/components/AddressChecking";
import { demoCheck } from "@/fixtures/demo";
import type { CheckRecord } from "@/domain/types";
import i18n from "@/i18n";

async function rec(end: string): Promise<CheckRecord> {
  const destination = `0x${"3".repeat(36)}${end}` as `0x${string}`;
  return { id: `c_${end}`, chainId: 43113, destination, demo: true, createdAt: Date.now(), result: await demoCheck(43113, destination) };
}
const wrap = (ui: React.ReactNode) => render(<MemoryRouter><TooltipProvider>{ui}</TooltipProvider></MemoryRouter>);

describe("VerdictCard", () => {
  it.each(["dead", "beef", "0000", "abcd"])("renders fixture %s without a safety claim or success tick in the verdict", async (end) => {
    await i18n.changeLanguage("en");
    const r = await rec(end);
    const { container } = wrap(<VerdictCard rec={r} />);
    expect(screen.getByTestId("verdict-banner")).toHaveAttribute("data-verdict", r.result.verdict);
    expect(screen.getAllByText("DEMO").length).toBeGreaterThan(0);
    const text = (container.textContent ?? "").toLowerCase().replaceAll("does not mean it is safe", "").replaceAll("does not guarantee the destination is safe", "");
    expect(text).not.toMatch(/\b(is safe|safe address)\b/);
    expect(screen.getByTestId("verdict-banner").querySelector(".lucide-check, .lucide-circle-check")).toBeNull();
    expect(screen.getByTestId("tier-strip").children).toHaveLength(5);
  }, 5000);
  it("renders evidence source links that open in a new tab", async () => {
    const r = await rec("dead");
    wrap(<VerdictCard rec={r} />);
    const links = screen.getAllByTestId("evidence-link");
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
    }
  });
});

describe("PreSendAlertSheet", () => {
  it("CRITICAL requires acknowledgement before continuing; cancel never continues", async () => {
    await i18n.changeLanguage("en");
    const r = await rec("dead");
    const onContinue = vi.fn();
    const onCancel = vi.fn();
    wrap(<PreSendAlertSheet open onOpenChange={() => {}} rec={r} onCancel={onCancel} onContinue={onContinue} onShowMore={() => {}} />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId("alert-continue"));
    expect(onContinue).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("alert-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
    await user.click(screen.getByTestId("ack-checkbox"));
    await user.click(screen.getByTestId("alert-continue"));
    expect(onContinue).toHaveBeenCalledOnce();
  });
  it("WARNING continues without the checkbox", async () => {
    const r = await rec("beef");
    const onContinue = vi.fn();
    wrap(<PreSendAlertSheet open onOpenChange={() => {}} rec={r} onCancel={() => {}} onContinue={onContinue} onShowMore={() => {}} />);
    expect(screen.queryByTestId("ack-checkbox")).toBeNull();
    await userEvent.setup().click(screen.getByTestId("alert-continue"));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});

describe("checking pipeline", () => {
  it("shows no completed remote step while running", () => {
    const s = deriveSteps("checking", null, null);
    expect([s.intel, s.onchain, s.community, s.policy]).toEqual(["running", "running", "running", "running"]);
  });
  it("maps timeouts from the result instead of ticking them", async () => {
    const r = await rec("0000");
    expect(deriveSteps("done", r, null).onchain).toBe("timeout");
  });
});

describe("transaction check origin", () => {
  it.each(["DEMO", "LIVE"] as const)("shows %s from the associated check rather than the presence of a check ID", async (checkMode) => {
    await i18n.changeLanguage("en");
    const address: `0x${string}` = "0x333333333333333333333333333333333333abcd";
    wrap(<TransactionSuccess tx={{ id: "tx", chainId: 43113, from: address, to: address, amount: "0.01", status: "confirmed", checkId: "check", verdict: "NO_KNOWN_RISK", createdAt: Date.now() }} checkMode={checkMode} />);
    expect(screen.getByText(checkMode)).toBeInTheDocument();
    expect(screen.queryByText(checkMode === "LIVE" ? "DEMO" : "LIVE")).toBeNull();
  });
});
