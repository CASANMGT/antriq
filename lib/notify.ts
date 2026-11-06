"use client";

export type NotificationPermissionState = NotificationPermission | "unsupported";

export function notificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function registerNotificationWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // Registration is optional; desktop Chrome/Firefox can still use Notification.
  }
}

export async function askNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") await registerNotificationWorker();
    return permission;
  } catch {
    return Notification.permission;
  }
}

export async function notify(title: string, body: string, url = "/"): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const options: NotificationOptions = {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: "antriq-call",
    data: { url },
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch {
    // Browsers can reject notifications in the background. Never break the queue.
  }
}
