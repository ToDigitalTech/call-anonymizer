# Call Anonymizer

**Privacy software by [To Digital Tech](https://github.com/ToDigitalTech).**
Open source, MIT licensed.

A Chrome extension that disguises your voice (pitch shift) and blurs your
camera feed in Google Meet, so you can stay on a call with an unverified
person without exposing your real voice or face. Toggle it off once you're
confident who you're talking to.

This project exists because of a real near-miss: a fake "job interview"
video call used to build trust before asking the target to run malicious
code. Anyone can end up on a call with a stranger before they've verified
who that person really is — this gives you a way to keep your voice and
face private until you have.

## Scope

- **Platform:** Google Meet only (`https://meet.google.com/*`). It works by
  intercepting the browser's `getUserMedia` call, which only exists for
  in-browser apps. It has no effect on the Zoom desktop app, since that
  app never goes through Chrome's media APIs.
- **Voice disguise:** real-time pitch shift (granular/overlap-add, no
  external libraries), adjustable in semitones.
- **Face disguise:** full-frame Gaussian blur of the outgoing video (drawn
  via `<canvas>`), not just the face region — simpler and also hides
  identifiable background details.
- **Live toggle:** a popup lets you flip anonymization on/off mid-call.
  It works by replacing the outgoing track on the active `RTCPeerConnection`
  senders, so Meet keeps the call running without a reconnect.

## Install (unpacked, for local/manual use)

1. Open `chrome://extensions`.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select this repo's folder.
4. Open `https://meet.google.com`, join/start a meeting, and use the
   extension's toolbar icon to toggle anonymization and adjust the pitch
   shift / blur amount.

## Files

- `manifest.json` — MV3 extension manifest, scoped to Meet.
- `content-script.js` — runs in the isolated world; injects `injected.js`
  into the page and relays popup ↔ page messages.
- `injected.js` — runs in the page's main world; wraps `getUserMedia` and
  `RTCPeerConnection` so it can build the disguised tracks and hot-swap
  them on live calls.
- `audio-processor.js` — an `AudioWorkletProcessor` implementing a simple
  granular pitch shifter.
- `popup.html` / `popup.css` / `popup.js` — the toolbar popup UI.

## Known limitations

- Full-frame blur, not face-only blur — there's no face detection model
  in this simple version, so the whole picture is blurred rather than
  just cropping out the face.
- Pitch shift quality is a lightweight DSP algorithm tuned for disguising
  a voice, not studio-quality pitch correction — expect a slightly
  robotic/grainy character, especially at larger shifts.
- Only covers Google Meet. Zoom's desktop app would need a completely
  separate approach (a virtual camera/microphone driver plus a native
  app), which is out of scope for this version.
- If Chrome blocks autoplay of the hidden preview `<video>` element used
  for blurring, the video pipeline may need a user gesture (e.g. clicking
  the page) before frames start flowing — Meet's own camera permission
  flow normally provides this.
- Live toggling mid-call works by hooking `RTCPeerConnection.addTrack` and
  calling `replaceTrack` on the matching sender. Meet's internal call
  setup isn't public/stable, so if a future Meet version adds tracks via
  a different API path (e.g. `addTransceiver` directly), the live toggle
  may not catch that sender — rejoining the call would still pick up the
  current enabled/disabled state correctly either way.

## License

MIT — see [LICENSE](./LICENSE). Contributions welcome.
