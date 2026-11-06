import { NextResponse } from "next/server";
import { actionError } from "@/lib/action";
import { getSession } from "@/lib/auth";
import {
  callEntry,
  callNext,
  canOperateBranch,
  clearTable,
  extendHold,
  joinQueue,
  markNoShow,
  seatEntry,
  setTableStatus,
  setWaitlistStatus,
  undoCall,
} from "@/lib/store";
import type { ActionResult, TableStatus, WaitlistStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Body = Record<string, any>;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ActionResult>({ ok: false, message: "Sign in again." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json<ActionResult>({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const branchId = Number(body.branchId);
  if (!Number.isInteger(branchId) || branchId <= 0) {
    return NextResponse.json<ActionResult>({ ok: false, message: "Choose a branch first." }, { status: 400 });
  }
  if (!(await canOperateBranch(session, branchId))) {
    return NextResponse.json<ActionResult>({ ok: false, message: "You don't have access to this branch." }, { status: 403 });
  }

  try {
    switch (String(body.type ?? "")) {
      case "callNext":
        return json(await callNext(branchId, session.name, Boolean(body.force)));
      case "callEntry":
        return json(await callEntry(branchId, Number(body.entryId), session.name));
      case "seat":
        return json(
          await seatEntry(
            branchId,
            Number(body.entryId),
            Number(body.tableId),
            session.name,
            session.staffId,
            body.seatNumber === null || body.seatNumber === undefined ? null : Number(body.seatNumber),
          ),
        );
      case "noShow":
        return json(await markNoShow(branchId, Number(body.entryId), session.name));
      case "undoCall":
        return json(await undoCall(branchId, Number(body.entryId), session.name));
      case "extend":
        return json(await extendHold(branchId, Number(body.entryId), Number(body.minutes ?? 5), session.name));
      case "walkin": {
        const result = await joinQueue(
          branchId,
          {
            guestName: String(body.guestName ?? ""),
            phone: body.phone ? String(body.phone) : undefined,
            partySize: Number(body.partySize),
            notes: body.notes ? String(body.notes) : undefined,
            source: "walkin",
            actor: session.name,
          },
          true,
        );
        return json({
          ok: true,
          message: `${result.code} added for ${body.guestName}.`,
          data: { code: result.code, token: result.token },
        });
      }
      case "clearTable":
        return json(await clearTable(branchId, Number(body.tableId), session.name, session.staffId));
      case "releaseSeat":
        return json(
          await clearTable(
            branchId,
            Number(body.tableId),
            session.name,
            session.staffId,
            body.reason ? String(body.reason) : null,
          ),
        );
      case "tableStatus": {
        const status = String(body.status ?? "");
        if (!["available", "dirty", "blocked"].includes(status)) {
          return json({ ok: false, message: "Unsupported table status." });
        }
        return json(await setTableStatus(branchId, Number(body.tableId), status as TableStatus, session.name));
      }
      case "waitlist": {
        const status = String(body.status ?? "");
        if (!["open", "paused", "closed"].includes(status)) {
          return json({ ok: false, message: "Unsupported queue status." });
        }
        return json(
          await setWaitlistStatus(
            branchId,
            status as WaitlistStatus,
            body.reason ? String(body.reason) : null,
            session.name,
          ),
        );
      }
      default:
        return json({ ok: false, message: "Unknown action." }, 400);
    }
  } catch (error) {
    const result = actionError(error);
    return json(result, result.message?.includes("went wrong") ? 500 : 400);
  }
}

function json(payload: ActionResult, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}
