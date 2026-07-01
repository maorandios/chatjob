self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "קלינג";
  const targetUrl = data.url || "/";

  event.waitUntil(
    shouldSuppressNotification(targetUrl, data).then((suppress) => {
      if (suppress) return;

      return self.registration.showNotification(title, {
        body: data.body || "הודעה חדשה",
        icon: "/icon",
        badge: "/apple-icon",
        data: {
          url: targetUrl,
          managerId: data.managerId,
          workerId: data.workerId,
        },
      });
    })
  );
});

function normalizePath(pathname) {
  try {
    return decodeURIComponent(pathname).replace(/\/$/, "") || "/";
  } catch {
    return pathname.replace(/\/$/, "") || "/";
  }
}

function isViewingConversation(client, targetUrl, data) {
  if (client.visibilityState !== "visible") return false;

  const clientPath = normalizePath(new URL(client.url).pathname);
  const targetPath = normalizePath(new URL(targetUrl, self.location.origin).pathname);

  if (clientPath === targetPath) return true;

  const managerId = data.managerId;
  const workerId = data.workerId;
  if (!managerId || !workerId) return false;

  if (clientPath === normalizePath(`/manager/chat/${workerId}`)) return true;

  const workerChatSuffix = `/chat/${managerId}`;
  return (
    clientPath.endsWith(workerChatSuffix) ||
    clientPath.endsWith(normalizePath(workerChatSuffix))
  );
}

function shouldSuppressNotification(targetUrl, data) {
  return self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) =>
      clients.some((client) => isViewingConversation(client, targetUrl, data))
    );
}

async function openTargetUrl(targetUrl) {
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;
  const targetPath = normalizePath(new URL(absoluteUrl).pathname);
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of clients) {
    const clientPath = normalizePath(new URL(client.url).pathname);
    if (clientPath === targetPath) {
      await client.focus();
      return;
    }
  }

  if (clients.length > 0) {
    const client = clients[0];
    await client.focus();

    if ("navigate" in client && typeof client.navigate === "function") {
      try {
        await client.navigate(absoluteUrl);
        return;
      } catch {
        // Fall back to in-app router navigation.
      }
    }

    client.postMessage({ type: "PUSH_NAVIGATE", url: targetPath });
    return;
  }

  await self.clients.openWindow(absoluteUrl);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawTargetUrl = event.notification.data?.url || "/";

  event.waitUntil(openTargetUrl(rawTargetUrl));
});

