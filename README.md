# Call Anonymizer: Voice & Face Privacy for Google Meet & Zoom

**Privacy software by [To Digital Tech](https://github.com/ToDigitalTech).**
Open source, MIT licensed. A Chrome extension for Google Meet and the Zoom
web client.

Disguises your voice (pitch shift) and distorts your camera feed (blur,
pixelate, puzzle-scramble, or glitch) on a video call, so you can stay on a
call with an unverified person without exposing your real voice or face.
Toggle it off once you're confident who you're talking to — live, mid-call,
no rejoin needed.

This project exists because of a real near-miss: a fake "job interview"
video call used to build trust before asking the target to run malicious
code. Anyone can end up on a call with a stranger before they've verified
who that person really is — this gives you a way to keep your voice and
face private until you have.

## Scope

- **Platforms:** Google Meet (`https://meet.google.com/*`) and the Zoom
  **web client** (`https://zoom.us/wc/*` and `https://*.zoom.us/wc/*`). It
  works by intercepting the browser's `getUserMedia` call, which only
  exists for in-browser apps — it has **no effect on the Zoom desktop
  app**, since that app never goes through Chrome's media APIs at all.
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
