export interface ReleaseSection {
  label: string;
  items: string[];
}

export interface Release {
  version: string;
  date: string;
  title: string;
  sections: ReleaseSection[];
}

/**
 * Curated in-app release notes. The full technical history lives in
 * CHANGELOG.md; this list is the short version shown at /changelog.
 */
export const RELEASES: Release[] = [
  {
    version: "0.9.0",
    date: "2026-11-09",
    title: "Host wait times + cleaner seated ticket",
    sections: [
      {
        label: "Added",
        items: [
          "Host queue and seated cards show how long the guest has waited.",
          "Waiting time is calculated from scan/join to now or to the call.",
        ],
      },
      {
        label: "Changed",
        items: [
          "Seat release is renamed to “Selesai” with a check icon.",
          "Seated guest tickets no longer show the host name or directions.",
        ],
      },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-11-07",
    title: "Nearest restaurants + distances",
    sections: [
      {
        label: "Added",
        items: [
          "Guest restaurant picker can use the visitor’s location.",
          "Brands and branches sort nearest first, with distance labels and a “Nearest” badge.",
          "Branch latitude/longitude fields in Settings and the branch editor.",
        ],
      },
      {
        label: "Fixed",
        items: [
          "Geolocation is now allowed by the site Permissions-Policy.",
          "If location is denied or unsupported, the default order remains available.",
        ],
      },
    ],
  },
  {
    version: "0.7.3",
    date: "2026-11-07",
    title: "Handover session hardening",
    sections: [
      {
        label: "Fixed",
        items: [
          "Staff sessions now re-check the live staff record.",
          "Pausing a staff member or changing their role takes effect on the next request.",
          "Inactive or deleted staff can no longer keep an old session.",
        ],
      },
    ],
  },
  {
    version: "0.7.2",
    date: "2026-11-07",
    title: "Guest details on the ticket",
    sections: [
      {
        label: "Added",
        items: [
          "The live ticket now shows the guest’s entered name and phone number.",
          "Long names wrap and long phone numbers stay fully visible.",
        ],
      },
    ],
  },
  {
    version: "0.7.1",
    date: "2026-11-07",
    title: "One active ticket per guest",
    sections: [
      {
        label: "Added",
        items: [
          "Duplicate protection by guest device cookie and phone number.",
          "An existing-ticket panel replaces the join form when a guest already has an active ticket.",
        ],
      },
      {
        label: "Fixed",
        items: [
          "Rejoining no longer creates a second active ticket.",
          "After releasing or completing a ticket, the guest can join again normally.",
        ],
      },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-11-07",
    title: "Operations audit + in-app changelog",
    sections: [
      {
        label: "Added",
        items: [
          "In-app version badge and changelog page.",
          "Owner and manager queue controls are clearly separated from front-line staff controls.",
        ],
      },
      {
        label: "Fixed",
        items: [
          "Greeters and cashiers can no longer pause or close the queue.",
          "Brand branch cards now show outside-hours state and actual opening hours.",
          "Manager dashboard no longer says “Owner dashboard”.",
          "Active-ticket banner no longer stretches the mobile guest join card.",
          "Mobile wordmark now matches desktop and keeps the receipt mark.",
        ],
      },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-11-07",
    title: "Queue control + service hours",
    sections: [
      {
        label: "Added",
        items: [
          "Dashboard pause/reopen control for owners and managers.",
          "Opening-hours panel for guests outside service hours.",
          "Server-side rejection of guest joins outside opening hours.",
        ],
      },
      {
        label: "Verified",
        items: ["Closed-hours page, 400 rejection, restore, and normal join."],
      },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-11-07",
    title: "Manager role + mobile polish",
    sections: [
      {
        label: "Added",
        items: [
          "Manager role for multi-brand/multi-branch monitoring.",
          "Managers can run the floor but cannot manage staff or settings.",
        ],
      },
      {
        label: "Fixed",
        items: ["Toasts sit above the mobile bottom navigation.", "Branch logo links to the brand page."],
      },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-11-07",
    title: "Single-group queue + production access",
    sections: [
      {
        label: "Added",
        items: [
          "Queue groups setting: 1 group by default, or A/B split.",
          "All-branch reports and CSV for owners.",
        ],
      },
      {
        label: "Changed",
        items: ["Production login hides demo PIN shortcuts."],
      },
    ],
  },
  {
    version: "0.3.9",
    date: "2026-11-07",
    title: "Clean print + verified notifications",
    sections: [
      {
        label: "Fixed",
        items: [
          "One-page A4 QR poster without the dashboard header.",
          "80 mm high-resolution QR and balanced print layout.",
        ],
      },
      {
        label: "Verified",
        items: ["Service-worker notification fires with the guest’s ticket code."],
      },
    ],
  },
];
