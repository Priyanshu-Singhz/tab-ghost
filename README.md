<div align="center">

# 👻 Tab Ghost

**Closed tabs come back as friendly ghosts. Click one to resurrect it.**

A tiny Chrome extension that makes "reopen closed tab" a lot more fun.

[Install](#install) · [How it works](#how-it-works) · [Privacy](#privacy) · [Roadmap](#roadmap)

</div>

---

## What is this?

You close a tab. A second later you realise you needed it.

Normally you'd dig through your history or hit `Cmd+Shift+T` and hope you get the right one. With Tab Ghost, every tab you close turns into a faint little ghost floating at the right edge of your screen. Hover to see what it was, click to bring it back.

## Features

- 👻 **Every closed tab becomes a ghost** with the site's favicon on its body
- 🔍 **Hover to peek:** page title, site, and how long ago you closed it
- 🖱️ **Click to resurrect** the tab, or hit the **×** to banish it for good
- ⏳ **Ghosts fade away** on their own after 24 hours
- 🧹 **Banish all** from the toolbar popup, which also shows how many ghosts you have
- 🎞️ **Hand-built animation:** floating, appearing and poofing are all CSS, no GIFs
- ♿ **Respects reduced-motion** settings
- 🔒 **Private by design:** nothing ever leaves your browser

### Smart about what it ignores

- Incognito tabs
- `chrome://` and other internal pages
- Closing a whole window (otherwise you'd get a ghost flood)

It keeps up to **8 ghosts**, one per page. Close the same page twice and you still get one ghost.

## Install

Tab Ghost isn't on the Chrome Web Store yet, so for now you install it by hand. It takes about 30 seconds.

1. **Download** the latest `tab-ghost.zip` from the [Releases page](../../releases/latest) and unzip it
   *(or clone this repo)*
2. Open `chrome://extensions` in Chrome
3. Turn on **Developer mode** (top right)
4. Click **Load unpacked** and choose the unzipped `tab-ghost` folder
5. Close a tab, then look at the right edge of any website 👀

> Works in Chrome, Edge, Brave, Arc and other Chromium browsers.
> Pages that were already open when you installed it get ghosts too, with no refresh needed.

## How it works

| Piece | Job |
| --- | --- |
| `background.js` | A service worker that remembers each open tab (title, URL, favicon). When a tab closes it saves a ghost to `chrome.storage.local`. It also handles cleanup and expiry. |
| `content.js` | Draws the ghosts inside a closed Shadow DOM at the edge of the page, so the page's own CSS can't break them and they can't break the page. |
| `popup.html` / `popup.js` | The toolbar popup: ghost count, **Banish all** button, and an About section. |

Everything is plain JavaScript, with no build step, no frameworks and no dependencies. Open the folder and read the code.

### Permissions, and why

| Permission | Why it's needed |
| --- | --- |
| `tabs` | To notice when a tab closes and remember its title, address and icon |
| `storage` | To keep the short list of ghosts on your own device |
| `scripting` + access to `http/https` sites | To draw the ghosts on top of the page you're viewing. **It does not read page content.** |

## Privacy

- No accounts
- No servers
- No analytics or tracking
- Ghosts are stored locally in your browser for up to 24 hours, then deleted

You can wipe them at any time with **Banish all ghosts**.

## Roadmap

- [ ] Hand-drawn ghost art and a better icon
- [ ] Pin a ghost so it doesn't fade
- [ ] Left or right edge, and a "hide on this site" option
- [ ] Badge on the toolbar icon showing the ghost count
- [ ] Ghosts get fainter as they age
- [ ] Keyboard shortcut to resurrect the most recent ghost
- [ ] Ghost personalities by site type (grumpy news ghost, sleepy video ghost)
- [ ] Chrome Web Store release

Ideas? [Open an issue](../../issues).

## Contributing

Pull requests are welcome. There's no build step: edit the files, hit the reload arrow on `chrome://extensions`, and try it.

## About

Made by **Priyanshu Singh**, an iOS and AI engineer who likes building small, odd, useful things.

- 💼 [LinkedIn](https://www.linkedin.com/in/priyanshusingha)
- 🐙 [GitHub](https://github.com/Priyanshu-Singhz)

If Tab Ghost saved you a tab, tell me how many it brought back 👻

## License

[MIT](LICENSE)
