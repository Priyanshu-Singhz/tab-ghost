const countEl = document.getElementById("count");
const btn = document.getElementById("b");

async function liveGhosts() {
  const { ghosts = [] } = await chrome.storage.local.get("ghosts");
  return ghosts.filter((g) => Date.now() - g.diedAt < 86400000);
}

async function refresh() {
  const n = (await liveGhosts()).length;
  countEl.textContent = n === 0 ? "No ghosts haunting you right now." : `${n} ghost${n === 1 ? "" : "s"} haunting you`;
  btn.disabled = n === 0;
}

btn.addEventListener("click", async () => {
  const n = (await liveGhosts()).length;
  await chrome.storage.local.set({ ghosts: [] });
  btn.textContent = `✓ Banished ${n} ghost${n === 1 ? "" : "s"}`;
  btn.classList.add("done");
  countEl.textContent = "No ghosts haunting you right now.";
  btn.disabled = true;
  setTimeout(() => window.close(), 1200);
});

refresh();
