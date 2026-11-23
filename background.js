// Tab Ghost - background service worker.
// Remembers tabs while they're open, and turns them into ghosts when closed.

const MAX_GHOSTS = 8;
const GHOST_TTL_MS = 24 * 60 * 60 * 1000; // ghosts fade away after a day

const isTrackable = (url) =>
  typeof url === "string" && /^https?:\/\//i.test(url);

async function getCache() {
  const { tabCache = {} } = await chrome.storage.session.get("tabCache");
  return tabCache;
}
async function setCache(tabCache) {
  await chrome.storage.session.set({ tabCache });
}

async function remember(tab) {
  if (!tab || tab.incognito || !isTrackable(tab.url)) return;
  const cache = await getCache();
  cache[tab.id] = {
    url: tab.url,
    title: tab.title || tab.url,
    favIconUrl: tab.favIconUrl || "",
  };
  await setCache(cache);
}

async function getGhosts() {
  const { ghosts = [] } = await chrome.storage.local.get("ghosts");
  const now = Date.now();
  return ghosts.filter((g) => now - g.diedAt < GHOST_TTL_MS);
}

async function setGhosts(ghosts) {
  await chrome.storage.local.set({ ghosts });
}

async function seedCache() {
  const tabs = await chrome.tabs.query({});
  const cache = {};
  for (const t of tabs) {
    if (!t.incognito && isTrackable(t.url)) {
      cache[t.id] = {
        url: t.url,
        title: t.title || t.url,
        favIconUrl: t.favIconUrl || "",
      };
    }
  }
  await setCache(cache);
}

// Content scripts only auto-run on pages loaded after install/reload,
// so inject into tabs that are already open.
async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const t of tabs) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: t.id }, files: ["content.js"] });
    } catch (e) { /* restricted page (e.g. Web Store) - ignore */ }
  }
}

chrome.runtime.onInstalled.addListener(() => { seedCache(); injectIntoOpenTabs(); });
chrome.runtime.onStartup.addListener(seedCache);

chrome.tabs.onCreated.addListener(remember);
chrome.tabs.onUpdated.addListener((id, change, tab) => {
  if (change.url || change.title || change.favIconUrl || change.status === "complete") {
    remember(tab);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, info) => {
  const cache = await getCache();
  const info_ = cache[tabId];
  delete cache[tabId];
  await setCache(cache);

  // Closing a whole window would summon a flood of ghosts - skip that.
  if (info.isWindowClosing || !info_) return;

  let ghosts = await getGhosts();
  // One ghost per URL: a re-closed page just refreshes its ghost.
  ghosts = ghosts.filter((g) => g.url !== info_.url);
  ghosts.unshift({
    id: `${Date.now()}-${tabId}`,
    url: info_.url,
    title: info_.title,
    favIconUrl: info_.favIconUrl,
    diedAt: Date.now(),
  });
  await setGhosts(ghosts.slice(0, MAX_GHOSTS));
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "resurrect") {
      const ghosts = await getGhosts();
      const g = ghosts.find((x) => x.id === msg.id);
      if (g) {
        await chrome.tabs.create({ url: g.url, active: true });
        await setGhosts(ghosts.filter((x) => x.id !== msg.id));
      }
    } else if (msg.type === "banish") {
      const ghosts = await getGhosts();
      await setGhosts(ghosts.filter((x) => x.id !== msg.id));
    } else if (msg.type === "banish-all") {
      await setGhosts([]);
    }
    sendResponse({ ok: true });
  })();
  return true;
});
