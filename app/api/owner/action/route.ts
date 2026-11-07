import { NextResponse } from "next/server";
import { actionError } from "@/lib/action";
import { getSession } from "@/lib/auth";
import {
  canManageBranch,
  canManageBrand,
  clearQueueData,
  createBrand,
  createBranch,
  createStaff,
  createTable,
  deleteTable,
  getBranch,
  listStaff,
  setStaffActive,
  setStaffPin,
  setWaitlistStatus,
  updateBrand,
  updateBranch,
  updateStaff,
  updateTable,
} from "@/lib/store";
import type { ActionResult, Role, WaitlistStatus } from "@/lib/types";
import { AppError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Body = Record<string, any>;

function requiredBranchId(body: Body): number {
  const id = Number(body.branchId);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Choose a branch first.");
  return id;
}

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

  const actor = session.name;
  const platformOwner = !session.brandId && !session.branchId;

  async function guardBranch(branchId: number) {
    if (!(await canManageBranch(session!, branchId))) {
      throw new AppError("You don't have access to this branch.");
    }
  }

  async function guardBrand(brandId: number) {
    if (!(await canManageBrand(session!, brandId))) {
      throw new AppError("You don't have access to this brand.");
    }
  }

  async function targetStaffInScope(staffId: number) {
    const people = await listStaff();
    const person = people.find((item) => item.id === staffId);
    if (!person) throw new AppError("Team member not found.");
    if (platformOwner) return person;
    if (session!.branchId) {
      if (person.branchId !== session!.branchId) throw new AppError("You can only manage staff at your branch.");
      if (person.role === "owner") throw new AppError("Only a platform owner can manage owners.");
      return person;
    }
    if (person.brandId !== session!.brandId) throw new AppError("You can only manage staff in your brand.");
    if (!person.brandId) throw new AppError("Only a platform owner can manage platform owners.");
    return person;
  }

  try {
    switch (String(body.type ?? "")) {
      case "settings": {
        const branchId = requiredBranchId(body);
        await guardBranch(branchId);
        const branch = await updateBranch(
          branchId,
          {
            name: String(body.name ?? ""),
            slug: body.slug !== undefined ? String(body.slug) : undefined,
            tagline: String(body.tagline ?? ""),
            address: String(body.address ?? ""),
            phone: String(body.phone ?? ""),
            openTime: String(body.openTime ?? ""),
            closeTime: String(body.closeTime ?? ""),
            accent: String(body.accent ?? ""),
            announcement: String(body.announcement ?? ""),
            timezone: String(body.timezone ?? ""),
            avgTurnMinutes: Number(body.avgTurnMinutes),
            holdMinutes: Number(body.holdMinutes),
            acknowledgeAction: body.acknowledgeAction === "extend" ? "extend" : "pause",
            acknowledgeMinutes: Number(body.acknowledgeMinutes),
            maxPartySize: Number(body.maxPartySize),
            maxQueueSize: Number(body.maxQueueSize),
            autoNoShow: Boolean(body.autoNoShow),
            seatingMode: body.seatingMode === "plan" ? "plan" : body.seatingMode === "manual" ? "manual" : "queue",
          },
          actor,
        );
        return json({ ok: true, message: "Settings saved.", data: { branch } });
      }
      case "brandCreate": {
        if (!platformOwner) {
          return json({ ok: false, message: "Only a platform owner can add a brand." });
        }
        const brand = await createBrand(
          {
            name: String(body.name ?? ""),
            slug: String(body.slug ?? ""),
            instagram: String(body.instagram ?? ""),
            description: String(body.description ?? ""),
            accent: String(body.accent ?? ""),
          },
          actor,
        );
        return json({ ok: true, message: `${brand.name} added.`, data: { brand } });
      }
      case "brandUpdate": {
        const brandId = Number(body.brandId);
        if (!Number.isInteger(brandId) || brandId <= 0) return json({ ok: false, message: "Choose a brand." });
        await guardBrand(brandId);
        const brand = await updateBrand(
          brandId,
          {
            name: String(body.name ?? ""),
            slug: String(body.slug ?? ""),
            instagram: String(body.instagram ?? ""),
            description: String(body.description ?? ""),
            accent: String(body.accent ?? ""),
          },
          actor,
        );
        return json({ ok: true, message: `${brand.name} saved.`, data: { brand } });
      }
      case "branchCreate": {
        const brandId = Number(body.brandId);
        if (!Number.isInteger(brandId) || brandId <= 0) return json({ ok: false, message: "Choose a brand." });
        if (session.branchId) {
          return json({ ok: false, message: "Branch owners can't add branches." });
        }
        await guardBrand(brandId);
        const branch = await createBranch(
          brandId,
          {
            name: String(body.name ?? ""),
            slug: String(body.slug ?? ""),
            tagline: String(body.tagline ?? ""),
            address: String(body.address ?? ""),
            phone: String(body.phone ?? ""),
            timezone: String(body.timezone ?? ""),
            openTime: String(body.openTime ?? ""),
            closeTime: String(body.closeTime ?? ""),
            accent: String(body.accent ?? ""),
            announcement: String(body.announcement ?? ""),
          },
          actor,
        );
        return json({ ok: true, message: `${branch.name} added.`, data: { branch } });
      }
      case "branchUpdate": {
        const branchId = requiredBranchId(body);
        await guardBranch(branchId);
        const branch = await updateBranch(
          branchId,
          {
            name: String(body.name ?? ""),
            slug: String(body.slug ?? ""),
            tagline: String(body.tagline ?? ""),
            address: String(body.address ?? ""),
            phone: String(body.phone ?? ""),
            timezone: String(body.timezone ?? ""),
            openTime: String(body.openTime ?? ""),
            closeTime: String(body.closeTime ?? ""),
            accent: String(body.accent ?? ""),
            announcement: String(body.announcement ?? ""),
          },
          actor,
        );
        return json({ ok: true, message: `${branch.name} saved.`, data: { branch } });
      }
      case "waitlist": {
        const branchId = requiredBranchId(body);
        await guardBranch(branchId);
        const status = String(body.status ?? "");
        if (!["open", "paused", "closed"].includes(status)) {
          return json({ ok: false, message: "Unsupported waitlist status." });
        }
        return json(
          await setWaitlistStatus(branchId, status as WaitlistStatus, body.reason ? String(body.reason) : null, actor),
        );
      }
      case "clearQueue": {
        const branchId = requiredBranchId(body);
        await guardBranch(branchId);
        return json(await clearQueueData(branchId, actor));
      }
      case "tableCreate": {
        const branchId = requiredBranchId(body);
        await guardBranch(branchId);
        return json(
          await createTable(
            branchId,
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
        const branchId = requiredBranchId(body);
        await guardBranch(branchId);
        return json(
          await updateTable(
            branchId,
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
        const branchId = requiredBranchId(body);
        await guardBranch(branchId);
        return json(await deleteTable(branchId, Number(body.id), actor));
      }
      case "staffCreate": {
        const role: Role =
          body.role === "owner" ? "owner" : body.role === "cashier" ? "cashier" : "greeter";
        let brandId = body.brandId ? Number(body.brandId) : null;
        let branchId = body.branchId ? Number(body.branchId) : null;

        if (session.branchId) {
          const branch = await getBranch(session.branchId);
          brandId = branch.brandId;
          branchId = session.branchId;
          if (role === "owner") return json({ ok: false, message: "Only a brand or platform owner can add owners." });
        } else if (session.brandId) {
          brandId = session.brandId;
          if (branchId) {
            const branch = await getBranch(branchId);
            if (branch.brandId !== session.brandId) {
              return json({ ok: false, message: "That branch belongs to another brand." });
            }
          }
          if (role === "owner" && !brandId) {
            return json({ ok: false, message: "Brand owners manage their own brand." });
          }
        } else if (role === "owner" && brandId) {
          // Platform owner may create brand owners (brand set) or another platform owner.
        }

        if (role !== "owner" && !branchId) {
          return json({ ok: false, message: "Greeters and cashiers need a branch." });
        }
        if (brandId) await guardBrand(brandId);
        if (branchId) await guardBranch(branchId);

        return json(
          await createStaff(
            {
              name: String(body.name ?? ""),
              role,
              pin: String(body.pin ?? ""),
              brandId,
              branchId,
            },
            actor,
          ),
        );
      }
      case "staffUpdate": {
        const staffId = Number(body.id);
        if (!Number.isInteger(staffId) || staffId <= 0) return json({ ok: false, message: "Choose a team member." });
        const person = await targetStaffInScope(staffId);
        const role: Role =
          body.role === "owner" ? "owner" : body.role === "cashier" ? "cashier" : "greeter";
        let brandId = body.brandId ? Number(body.brandId) : null;
        let branchId = body.branchId ? Number(body.branchId) : null;

        if (session.branchId) {
          brandId = person.brandId ?? null;
          branchId = session.branchId;
          if (role === "owner") return json({ ok: false, message: "Only a brand or platform owner can change roles to owner." });
        } else if (session.brandId) {
          brandId = session.brandId;
          if (branchId) {
            const branch = await getBranch(branchId);
            if (branch.brandId !== session.brandId) {
              return json({ ok: false, message: "That branch belongs to another brand." });
            }
          }
          if (role === "owner" && !brandId) {
            return json({ ok: false, message: "Brand owners manage their own brand." });
          }
        }
        if (role !== "owner" && !branchId) {
          return json({ ok: false, message: "Greeters and cashiers need a branch." });
        }
        if (brandId) await guardBrand(brandId);
        if (branchId) await guardBranch(branchId);

        return json(
          await updateStaff(
            staffId,
            {
              name: String(body.name ?? person.name),
              role,
              pin: body.pin ? String(body.pin) : undefined,
              brandId,
              branchId,
            },
            actor,
          ),
        );
      }
      case "staffPin": {
        const staffing = await targetStaffInScope(Number(body.id));
        return json(await setStaffPin(staffing.id, String(body.pin ?? ""), actor));
      }
      case "staffToggle": {
        const staffing = await targetStaffInScope(Number(body.id));
        if (platformOwner && staffing.role === "owner" && !staffing.brandId && !staffing.branchId) {
          const people = await listStaff();
          const activePlatformOwners = people.filter(
            (person) => person.role === "owner" && person.active && !person.brandId && !person.branchId,
          );
          if (!body.active && activePlatformOwners.length <= 1) {
            return json({ ok: false, message: "You need at least one platform owner." });
          }
        }
        return json(await setStaffActive(staffing.id, Boolean(body.active), actor));
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
