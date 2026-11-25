# Floppy fake crash (design)

## Intent
Floppy already takes the mouse for a moment after being picked up three times in 30 s ("hijack"). Push the joke further:
when he has hijacked the mouse a third time, the page fakes an operating-system crash that matches the visitor's system.
Pure gag; nothing is actually harmed.

## Goals
- Third hijack ends, then a full-screen fake crash screen for the detected OS (Windows blue screen, macOS restart-after-panic screen, Linux kernel panic).
- Auto-recovers (black "reboot", page returns, Floppy makes a sheepish remark).
- Visitor can always leave: `Escape` or a click (after a short grace period).

- After the black "reboot", `public/rickroll.mp4` (9 s, with sound, full screen) plays, then the page is back to normal (added on request). It preloads during the crash and is skipped if not ready in time. Muted when the site's sound toggle is off. `public/rickroll.gif` (~35 MB) is not used.

- Changes after review: the rickroll is the `.gif` (picture) plus the `.mp4` audio at `ROLL_VOLUME` 0.15; the Windows QR is a fake generated pattern (does not scan); Floppy warns when the 2nd hijack ends, announces the crash when the 3rd starts (that hijack lasts long enough to read it), and goes red, shaking, with flames and burning eyes until the crash is over.

## Non-goals / anti-goals
- No real Fullscreen API, no blocking the tab, no touching real system state.
- Must never trap a visitor or look like a real malware/scam page: no links, no phone numbers, no downloads.
- Not shown to reduced-motion visitors (the hijack itself is skipped for them, so they never get there).

## Approaches
1. **In-page overlay (chosen).** A teleported full-viewport component, same pattern as the hijack overlay. Simple, no permissions.
2. Fullscreen API. Rejected: needs a user gesture; the hijack landing is not one.
3. Also fake the tab title/favicon. Rejected as extra scope.

## Design
- `app/utils/detectOs.ts`: `detectOs()` returns `'windows' | 'mac' | 'linux'` from `navigator.userAgentData?.platform` / `userAgent`. Android is Linux, iPhone/iPad is Mac, unknown is Windows.
- `app/components/FakeCrash.vue`: prop `os`, emits `done`. Shows ~7 s, then 1.2 s black, then `done`. `Escape` / click ends early (click ignored for the first 1.5 s). Screen-reader hint in the active locale. Crash text itself is English system text.
- `FloppyHelper.vue`: count hijacks per page visit (not stored; resets on reload). When the 3rd ends (and Floppy is still visible), set the crash OS instead of the usual end quip; on `done` Floppy says a new quip. Counter resets after a crash.
- Locales (`en.ts`, `nl.ts`): `crashBack`, `crashHint`. Sound: `floppyCrash` in `useStageSound`.

## Calls made without asking
- Fires at the end of the 3rd hijack, so the visitor sees him take the mouse first.
- Hiding Floppy or changing step mid-hijack does not trigger the crash.
