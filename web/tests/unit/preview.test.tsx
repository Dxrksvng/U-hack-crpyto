import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckRecord } from "@/domain/types";
import { demoCheck } from "@/fixtures/demo";
import Preview from "@/pages/Preview";
import i18n from "@/i18n";
import { toChecksum } from "@/lib/address";

const mocks = vi.hoisted(() => ({
  account: { address: "0x1111111111111111111111111111111111111111", isConnected: true, chainId: 43113 },
  session: { chainId: 43113, destination: "0x333333333333333333333333333333333333abcd", amount: "0.01", current: null as CheckRecord | null, acknowledged: new Set<string>(), runCheck: vi.fn(), acknowledge: vi.fn() },
  send: vi.fn(),
}));
vi.mock("wagmi", () => ({ useAccount: () => mocks.account, useBalance: () => ({ data: { value: 10n ** 20n } }), useSwitchChain: () => ({ switchChain: vi.fn(), isPending: false }) }));
vi.mock("@/state/session", () => ({ useSession: () => mocks.session }));
vi.mock("@/state/ui", () => ({ useUI: () => ({ setWalletOpen: vi.fn(), setMenuOpen: vi.fn() }) }));
vi.mock("@/lib/useFee", () => ({ useFeeEstimate: () => ({ fee: 1000n, loading: false }) }));
vi.mock("@/lib/useTransfer", () => ({ useTransfer: () => ({ send: mocks.send, inFlight: false }) }));
vi.mock("@/components/TransactionPreview", () => ({ TransactionPreview: () => <div>Review details</div> }));

const destination: `0x${string}` = "0x333333333333333333333333333333333333abcd";
const mount = () => render(<MemoryRouter><Preview /></MemoryRouter>);

beforeEach(async () => {
  vi.clearAllMocks();
  await i18n.changeLanguage("en");
  mocks.account = { address: "0x1111111111111111111111111111111111111111", isConnected: true, chainId: 43113 };
  mocks.session.chainId = 43113;
  mocks.session.destination = destination;
  mocks.session.amount = "0.01";
  mocks.session.current = { id: "old", destination, chainId: 43113, demo: true, createdAt: Date.now() - 11 * 60_000, result: await demoCheck(43113, destination) };
});

describe("review revalidation", () => {
  it.each(["account", "walletChain", "destination", "chain", "amount", "disconnect", "restoredAccount", "unmount"])("does not invoke the wallet after %s changes while a stale check refreshes", async (change) => {
    let resolveCheck: (record: CheckRecord) => void = () => {};
    mocks.session.runCheck.mockImplementation(() => new Promise<CheckRecord>((resolve) => { resolveCheck = resolve; }));
    const view = mount();
    await userEvent.setup().click(screen.getByTestId("continue-wallet"));
    expect(mocks.session.runCheck).toHaveBeenCalledOnce();
    const original = mocks.session.current;
    if (!original) throw new Error("fixture missing");
    if (change === "account") mocks.account.address = "0x2222222222222222222222222222222222222222";
    if (change === "walletChain") mocks.account.chainId = 11155111;
    if (change === "destination") mocks.session.destination = "0x444444444444444444444444444444444444abcd";
    if (change === "chain") mocks.session.chainId = 11155111;
    if (change === "amount") mocks.session.amount = "0.02";
    if (change === "disconnect") mocks.account.isConnected = false;
    if (change === "restoredAccount") {
      const address = mocks.account.address;
      mocks.account.address = "0x2222222222222222222222222222222222222222";
      view.rerender(<MemoryRouter><Preview /></MemoryRouter>);
      mocks.account.address = address;
    }
    if (change === "unmount") view.unmount();
    else view.rerender(<MemoryRouter><Preview /></MemoryRouter>);
    await act(async () => { resolveCheck({ ...original, id: "fresh", createdAt: Date.now() }); });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("requests the wallet once after an unchanged context successfully refreshes", async () => {
    const original = mocks.session.current;
    if (!original) throw new Error("fixture missing");
    mocks.session.runCheck.mockResolvedValue({ ...original, id: "fresh", createdAt: Date.now() });
    mount();
    await userEvent.setup().click(screen.getByTestId("continue-wallet"));
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: toChecksum(destination), amount: "0.01", chainId: 43113, checkId: "fresh" }));
  });
});
