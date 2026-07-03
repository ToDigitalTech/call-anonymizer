// Runs in the page's main world. Wraps getUserMedia to build a disguised
// (pitch-shifted + blurred) version of each local track, and wraps
// RTCPeerConnection so the active call's outgoing tracks can be hot-swapped
// when the popup toggles anonymization on/off.

(function () {
  const currentScript = document.currentScript;
  const workletUrl = currentScript.dataset.workletUrl;

  const state = {
    enabled: true,
    pitchSemitones: 5,
    blurPx: 20,
    pairs: [], // { rawTrack, processedTrack, kind }
    senders: [], // RTCRtpSender instances seen so far
  };

  const nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  let sharedAudioContext = null;

  function pitchRatio(semitones) {
    return Math.pow(2, semitones / 12);
  }

  async function makeProcessedAudioTrack(rawTrack) {
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContext();
      await sharedAudioContext.audioWorklet.addModule(workletUrl);
    }
    const source = sharedAudioContext.createMediaStreamSource(new MediaStream([rawTrack]));
    const node = new AudioWorkletNode(sharedAudioContext, 'pitch-shift-processor');
    node.port.postMessage({ pitchRatio: pitchRatio(state.pitchSemitones) });
    state.pitchNodes = state.pitchNodes || [];
    state.pitchNodes.push(node);
    const dest = sharedAudioContext.createMediaStreamDestination();
    source.connect(node).connect(dest);
    return dest.stream.getAudioTracks()[0];
  }

  function makeBlurredVideoTrack(rawTrack) {
    const video = document.createElement('video');
    video.srcObject = new MediaStream([rawTrack]);
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let stopped = false;

    function draw() {
      if (stopped) return;
      if (video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.filter = `blur(${state.blurPx}px)`;
        ctx.drawImage(video, 0, 0);
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    const canvasStream = canvas.captureStream(30);
    const track = canvasStream.getVideoTracks()[0];
    rawTrack.addEventListener('ended', () => {
      stopped = true;
      track.stop();
    });
    return track;
  }

  async function buildPair(rawTrack) {
    const processedTrack =
      rawTrack.kind === 'audio'
        ? await makeProcessedAudioTrack(rawTrack)
        : makeBlurredVideoTrack(rawTrack);
    const pair = { rawTrack, processedTrack, kind: rawTrack.kind };
    state.pairs.push(pair);
    return pair;
  }

  function activeTrackFor(pair) {
    return state.enabled ? pair.processedTrack : pair.rawTrack;
  }

  navigator.mediaDevices.getUserMedia = async function (constraints) {
    const rawStream = await nativeGetUserMedia(constraints);
    const outStream = new MediaStream();
    for (const rawTrack of rawStream.getTracks()) {
      const pair = await buildPair(rawTrack);
      outStream.addTrack(activeTrackFor(pair));
    }
    return outStream;
  };

  const NativePeerConnection = window.RTCPeerConnection;
  window.RTCPeerConnection = function (...args) {
    const pc = new NativePeerConnection(...args);
    const nativeAddTrack = pc.addTrack.bind(pc);
    pc.addTrack = (track, ...rest) => {
      const sender = nativeAddTrack(track, ...rest);
      state.senders.push({ sender, track });
      return sender;
    };
    return pc;
  };
  window.RTCPeerConnection.prototype = NativePeerConnection.prototype;

  function applyEnabledState() {
    for (const pair of state.pairs) {
      const wanted = activeTrackFor(pair);
      for (const entry of state.senders) {
        if (entry.track === pair.rawTrack || entry.track === pair.processedTrack) {
          if (entry.sender.track !== wanted) {
            entry.sender.replaceTrack(wanted);
          }
          entry.track = wanted;
        }
      }
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'call-anonymizer' || data.type !== 'settings') return;

    const settings = data.settings;
    if (typeof settings.enabled === 'boolean') state.enabled = settings.enabled;
    if (typeof settings.blurPx === 'number') state.blurPx = settings.blurPx;
    if (typeof settings.pitchSemitones === 'number') {
      state.pitchSemitones = settings.pitchSemitones;
      for (const node of state.pitchNodes || []) {
        node.port.postMessage({ pitchRatio: pitchRatio(state.pitchSemitones) });
      }
    }
    applyEnabledState();
  });
})();
