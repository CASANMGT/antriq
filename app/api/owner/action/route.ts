import { NextResponse } from "next/server";
import { actionError } from "@/lib/action";
import { getSession } from "@/lib/auth";
import {
  createStaff,
  createTable,
  deleteTable,
  setStaffActive,
  setStaffPin,
  setWaitlistStatus,
  updateRestaurant,
  updateTable,
} from "@/lib/store";
import type { ActionResult, Role, WaitlistStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Body = Record<string, any>;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json<ActionResult>({ ok: false, message: "Owner access required." }, { status: 401 });
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
      case "settings": {
        const restaurant = await updateRestaurant(
          {
            name: String(body.name ?? ""),
            tagline: String(body.tagline ?? ""),
            address: String(body.address ?? ""),
            phone: String(body.phone ?? ""),
            instagram: String(body.instagram ?? ""),
            openTime: String(body.openTime ?? ""),
            closeTime: String(body.closeTime ?? ""),
            accent: String(body.accent ?? ""),
            announcement: String(body.announcement ?? ""),
            timezone: String(body.timezone ?? ""),
            avgTurnMinutes: Number(body.avgTurnMinutes),
            holdMinutes: Number(body.holdMinutes),
            maxPartySize: Number(body.maxPartySize),
            maxQueueSize: Number(body.maxQueueSize),
            autoNoShow: Boolean(body.autoNoShow),
          },
          actor,
        );
        return json({ ok: true, message: "Settings saved.", data: { restaurant } });
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
      case "tableCreate": {
        return json(
          await createTable(
            {
              label: String(body.label ?? ""),
              capacity: Number(body.capacity),
              zone: String(body.zone ?? ""),
            },
            actor,
          ),
        );
      }
      case "tableUpdate": {
        return json(
          await updateTable(
            Number(body.id),
            {
              label: String(body.label ?? ""),
              capacity: Number(body.capacity),
              zone: String(body.zone ?? ""),
            },
            actor,
          ),
        );
      }
      case "tableDelete": {
        return json(await deleteTable(Number(body.id), actor));
      }
      case "staffCreate": {
        return json(
          await createStaff(
            {
              name: String(body.name ?? ""),
              role: (body.role === "owner" ? "owner" : "greeter") as Role,
              pin: String(body.pin ?? ""),
            },
            actor,
          ),
        );
      }
      case "staffPin": {
        return json(await setStaffPin(Number(body.id), String(body.pin ?? ""), actor));
      }
      case "staffToggle": {
        return json(await setStaffActive(Number(body.id), Boolean(body.active), actor));
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
