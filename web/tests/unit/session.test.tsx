import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "@/state/session";
import { checkDestination } from "@/lib/api";
import { demoCheck } from "@/fixtures/demo";
import type { CheckRecord } from "@/domain/types";
import Consult from "@/pages/Consult";

vi.mock("@/components/ConsultChat", () => ({
  ConsultChat: ({ rec }: { rec: CheckRecord | null }) => <div data-testid="consult-recipient">{rec?.destination}</div>,
  ChatMessage: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, checkDestination: vi.fn() };
});

it("restores a historical check's recipient and network before review, retaining the entered amount", async () => {
  const firstAddress: `0x${string}` = "0x333333333333333333333333333333333333abcd";
  const otherAddress: `0x${string}` = "0x444444444444444444444444444444444444abcd";
  const fixture = await demoCheck(43113, firstAddress);
  vi.mocked(checkDestination).mockResolvedValue({ result: fixture, demo: true });
  const { result } = renderHook(() => useSession(), { wrapper: ({ children }) => <SessionProvider>{children}<Consult /></SessionProvider> });
  act(() => { result.current.setDestination(firstAddress); result.current.setChainId(43113); });
  await act(async () => { await result.current.runCheck(43113, firstAddress); });
  const first = result.current.current;
  if (!first) throw new Error("first check missing");
  act(() => { result.current.setDestination(otherAddress); result.current.setChainId(11155111); result.current.setAmount("0.025"); });
  await act(async () => { await result.current.runCheck(11155111, otherAddress); });
  expect(result.current.current?.destination).toBe(otherAddress);
  act(() => result.current.selectCheck(first.id));
  expect(result.current.destination).toBe(firstAddress);
  expect(result.current.chainId).toBe(43113);
  expect(result.current.current?.id).toBe(first.id);
  expect(result.current.amount).toBe("0.025");
  expect(result.current.checks).toHaveLength(2);
  expect(screen.getByTestId("consult-recipient")).toHaveTextContent(firstAddress);
});
