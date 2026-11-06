import { NextResponse } from "next/server";
import { actionError } from "@/lib/action";
import { getSession } from "@/lib/auth";
import {
  callEntry,
  callNext,
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

  try {
    const actor = session.name;
    switch (String(body.type ?? "")) {
      case "callNext": {
        return json(await callNext(actor, Boolean(body.force)));
      }
      case "callEntry": {
        return json(await callEntry(Number(body.entryId), actor));
      }
      case "seat": {
        return json(await seatEntry(Number(body.entryId), Number(body.tableId), actor));
      }
      case "noShow": {
        return json(await markNoShow(Number(body.entryId), actor));
      }
      case "undoCall": {
        return json(await undoCall(Number(body.entryId), actor));
      }
      case "extend": {
        return json(await extendHold(Number(body.entryId), Number(body.minutes ?? 5), actor));
      }
      case "walkin": {
        const result = await joinQueue(
          {
            guestName: String(body.guestName ?? ""),
            phone: body.phone ? String(body.phone) : undefined,
            partySize: Number(body.partySize),
            notes: body.notes ? String(body.notes) : undefined,
            source: "walkin",
            actor,
          },
          true,
        );
        return json({
          ok: true,
          message: `${result.code} added for ${body.guestName}.`,
          data: { code: result.code, token: result.token },
        });
      }
      case "clearTable": {
        return json(await clearTable(Number(body.tableId), actor));
      }
      case "tableStatus": {
        const status = String(body.status ?? "");
        if (!["available", "dirty", "blocked"].includes(status)) {
          return json({ ok: false, message: "Unsupported table status." });
        }
        return json(await setTableStatus(Number(body.tableId), status as TableStatus, actor));
      }
      case "waitlist": {
        const status = String(body.status ?? "");
        if (!["open", "paused", "closed"].includes(status)) {
          return json({ ok: false, message: "Unsupported waitlist status." });
        }
        return json(
          await setWaitlistStatus(status as WaitlistStatus, body.reason ? String(body.reason) : null, actor),
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
