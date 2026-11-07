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
