<img width="1862" height="1082" alt="Call anon to digital" src="https://github.com/user-attachments/assets/a824760d-0f3a-478a-9d6a-0970a07fe275" />


# Call Anonymizer: Voice & Face Privacy for Google Meet & Zoom

**Privacy software by [To Digital Tech](https://github.com/ToDigitalTech).**
Open source, MIT licensed. A Chrome extension for Google Meet and the Zoom
web client.

Disguises your voice (pitch shift) and distorts your camera feed (blur,
pixelate, puzzle-scramble, or glitch) on a video call, so you can stay on a
call with an unverified person without exposing your real voice or face.
Toggle it off once you're confident who you're talking to — live, mid-call,
no rejoin needed.

**Works with:** Google Meet, and Zoom when joined through the browser
(the "join from your browser" link, not the desktop app). See
[Scope](#scope) for exactly which URLs and why.

## Why this exists

This project exists because of a real near-miss: a fake "job interview"
video call that asked the target to clone and run a GitHub repo mid-call
as a "coding test." The interviewer's on-camera face didn't match the
accent being heard, which was the tell that something was wrong — the
call was ended before any code was run.

This isn't an isolated case. In January 2026, Fireblocks CEO Michael
Shaulov detailed a North Korea-linked campaign ("Operation Contagious
Interview," attributed to the Lazarus Group/APT38) that impersonates
recruiters on LinkedIn, runs real live-video interviews over Google Meet
to build trust, and then delivers malware disguised as a take-home coding
assignment shared via GitHub ([CNBC, Jan 30 2026](https://www.cnbc.com/2026/01/30/fireblocks-north-korea-hackers-crypto-job-scam.html)).

Beyond the malware risk, sitting through a live video interview also
hands a stranger your voice and on-camera mannerisms — material that
could plausibly be reused to train a voice clone or a "digital twin" for
a bigger impersonation attack later, against you or someone else. If
anything about a call feels off, this lets you keep your real voice and
face private until you've decided the person on the other end is who
they say they are. It's aimed at anyone currently interviewing and
navigating a job market where AI-assisted impersonation is a real risk,
not just a hypothetical one.

## Scope

- **Platforms — what it works with:**
  - ✅ Google Meet (`https://meet.google.com/*`)
  - ✅ Zoom, only when joined via the **browser web client**
    (`https://zoom.us/wc/*` and `https://*.zoom.us/wc/*` — the "join from
    your browser" link)
  - ❌ Zoom **desktop app** — not possible for a browser extension to
    reach, since the desktop app never goes through Chrome's media APIs
  - ❌ Other platforms (Teams, Slack huddles, Discord, etc.) — not
    supported by this version, though the same technique could extend to
    any browser-based video call

  It works by intercepting the browser's `getUserMedia` call, which only
  exists for in-browser apps.
- **Voice disguise:** real-time pitch shift (granular/overlap-add, no
  external libraries), adjustable in semitones, plus a keyboard shortcut
  (`Alt+Shift+A`) to toggle it instantly without opening the popup.
- **Face disguise — four distortion modes**, picked from the popup:
  - **Blur** — full-frame Gaussian blur.
  - **Pixelate** — chunky mosaic/blockiness.
  - **Puzzle scramble** — the frame is cut into an N×N grid and the tiles
    are shuffled into a fixed random permutation, like a jigsaw puzzle.
    Use the "Reshuffle puzzle" button to pick a new permutation.
  - **Glitch** — analog-style horizontal band jitter plus a colour-channel
    shift.

  All four distort the *whole* frame, not just a detected face region —
  simpler, and it also hides identifiable background details.
- **Live toggle:** the popup (or the keyboard shortcut) flips anonymization
  on/off mid-call by replacing the outgoing track on the active
  `RTCPeerConnection` senders, so the call keeps running without a
  reconnect.
- **Toolbar badge:** the extension icon shows an "ON"/"OFF" badge so you
  can tell your current state at a glance.

## Install (unpacked, for local/manual use)

1. Open `chrome://extensions`.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select this repo's folder.
4. Open `https://meet.google.com` or join a Zoom meeting via its **browser**
   join link (not the desktop app), and use the extension's toolbar icon
   to toggle anonymization and adjust the voice/face settings.

## Files

- `manifest.json` — MV3 extension manifest, scoped to Meet and Zoom web.
- `background.js` — service worker; toolbar badge and the `Alt+Shift+A`
  toggle shortcut.
- `content-script.js` — runs in the isolated world; injects
  `video-effects.js` and `injected.js` into the page and relays popup ↔
  page messages.
- `injected.js` — runs in the page's main world; wraps `getUserMedia` and
  `RTCPeerConnection` so it can build the disguised tracks and hot-swap
  them on live calls.
- `video-effects.js` — the canvas drawing routines for each distortion
  mode (blur/pixelate/puzzle/glitch).
- `audio-processor.js` — an `AudioWorkletProcessor` implementing a simple
  granular pitch shifter.
- `popup.html` / `popup.css` / `popup.js` — the toolbar popup UI.

## Known limitations

- These are whole-frame effects, not face-only — there's no face detection
  model in this simple version.
- Pitch shift quality is a lightweight DSP algorithm tuned for disguising
  a voice, not studio-quality pitch correction — expect a slightly
  robotic/grainy character, especially at larger shifts.
- Zoom's **desktop app** isn't covered and can't be by a browser extension
  — only the Zoom **web client** is. Covering the desktop app would need a
  virtual camera/microphone driver plus a native app, which is out of
  scope for this version.
- If Chrome blocks autoplay of the hidden preview `<video>` element used
  for the video effects, the pipeline may need a user gesture (e.g.
  clicking the page) before frames start flowing — the call's own camera
  permission flow normally provides this.
- Live toggling mid-call works by hooking `RTCPeerConnection.addTrack` and
  calling `replaceTrack` on the matching sender. Meet's and Zoom's internal
  call setup isn't public/stable, so if a future version adds tracks via a
  different API path (e.g. `addTransceiver` directly), the live toggle may
  not catch that sender — rejoining the call would still pick up the
  current enabled/disabled state correctly either way.

## License

MIT — see [LICENSE](./LICENSE). Contributions welcome.
