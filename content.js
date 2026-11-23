// Tab Ghost - content script. Draws ghosts at the right edge of the page.
(() => {
  if (window.top !== window || document.getElementById("tab-ghost-host")) return;

  const host = document.createElement("div");
  host.id = "tab-ghost-host";
  host.style.cssText =
    "all:initial;position:fixed;top:0;right:0;height:100vh;width:0;z-index:2147483647;pointer-events:none;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      .col { position:fixed; right:10px; top:50%; transform:translateY(-50%);
             display:flex; flex-direction:column; gap:14px; align-items:flex-end;
             pointer-events:none; font-family:-apple-system,system-ui,sans-serif; }
      .ghost { position:relative; width:52px; height:62px; cursor:pointer;
               pointer-events:auto; opacity:.38; transition:opacity .2s, transform .2s;
               animation: float 3.6s ease-in-out infinite, appear .6s ease-out; }
      .ghost:nth-child(2n) { animation-duration:4.4s; animation-delay:-1.2s; }
      .ghost:nth-child(3n) { animation-duration:5s;   animation-delay:-2.4s; }
      .ghost:hover { opacity:1; transform:translateX(-8px) scale(1.12); animation-play-state:paused; }
      svg.body { width:100%; height:100%; filter:drop-shadow(0 4px 8px rgba(0,0,0,.25)); }
      .fav { position:absolute; left:50%; top:11px; width:16px; height:16px;
             transform:translateX(-50%); border-radius:3px; background:#fff; object-fit:cover; }
      .tip { position:absolute; right:62px; top:50%; transform:translateY(-50%);
             background:#1f1f2e; color:#fff; padding:6px 10px; border-radius:8px;
             font-size:12px; width:max-content; max-width:240px; line-height:1.3;
             opacity:0; pointer-events:none; transition:opacity .15s; }
      .tip b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tip small { opacity:.65; }
      .ghost:hover .tip { opacity:1; }
      .x { position:absolute; top:-4px; left:-4px; width:18px; height:18px; border-radius:50%;
           background:#1f1f2e; color:#fff; font-size:12px; line-height:18px; text-align:center;
           opacity:0; transition:opacity .15s; }
      .ghost:hover .x { opacity:1; }
      .pop { animation: poof .45s ease-in forwards !important; }
      @keyframes float  { 0%,100% { translate:0 0 } 50% { translate:-4px -9px } }
      @keyframes appear { from { opacity:0; transform:translateX(40px) } }
      @keyframes poof   { to { opacity:0; transform:translateY(-40px) scale(1.5); filter:blur(4px) } }
      @media (prefers-reduced-motion: reduce) { .ghost { animation:none !important; } }
    </style>
    <div class="col"></div>`;
  const col = root.querySelector(".col");

  const SVG = `<svg class="body" viewBox="0 0 52 62" xmlns="http://www.w3.org/2000/svg">
    <path d="M26 2C13 2 4 12 4 25v31c0 3 3 4 5 2l5-5 5 5c2 2 4 2 6 0l1-1 1 1c2 2 4 2 6 0l5-5 5 5c2 2 5 1 5-2V25C48 12 39 2 26 2z" fill="#f4f1ff" stroke="#b9aef0" stroke-width="2"/>
    <circle cx="19" cy="34" r="3.2" fill="#2b2540"/><circle cx="33" cy="34" r="3.2" fill="#2b2540"/>
    <ellipse cx="26" cy="43" rx="3" ry="3.6" fill="#2b2540"/></svg>`;

  const ago = (t) => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m / 60)}h ago`;
  };
  const hostname = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  function render(ghosts) {
    col.innerHTML = "";
    for (const g of ghosts) {
      const el = document.createElement("div");
      el.className = "ghost";
      el.innerHTML = `${SVG}
        ${g.favIconUrl ? `<img class="fav" src="${esc(g.favIconUrl)}" alt="">` : ""}
        <div class="x" title="Banish">×</div>
        <div class="tip"><b>${esc(g.title)}</b><small>${esc(hostname(g.url))} · ${ago(g.diedAt)} · click to resurrect</small></div>`;
      const fav = el.querySelector(".fav");
      if (fav) fav.addEventListener("error", () => fav.remove());
      el.querySelector(".x").addEventListener("click", (e) => {
        e.stopPropagation();
        el.classList.add("pop");
        setTimeout(() => chrome.runtime.sendMessage({ type: "banish", id: g.id }), 300);
      });
      el.addEventListener("click", () => {
        el.classList.add("pop");
        chrome.runtime.sendMessage({ type: "resurrect", id: g.id });
      });
      col.appendChild(el);
    }
  }

  const load = async () => {
    try {
      const { ghosts = [] } = await chrome.storage.local.get("ghosts");
      const fresh = ghosts.filter((g) => Date.now() - g.diedAt < 86400000);
      render(fresh);
    } catch { /* extension reloaded; page is stale */ }
  };

  chrome.storage.onChanged.addListener((c, area) => {
    if (area === "local" && c.ghosts) load();
  });
  document.documentElement.appendChild(host);
  load();
})();
