// Runs in the isolated world. Injects video-effects.js and injected.js into
// the page's main world (needed to override getUserMedia/RTCPeerConnection
// before Meet's/Zoom's own code runs) and relays settings between the popup
// and the page.

(function () {
  const workletUrl = chrome.runtime.getURL('audio-processor.js');
  const root = document.head || document.documentElement;

  // Dynamically inserted <script> tags load async by default, so without
  // `async = false` these two could execute out of order (injected.js calls
  // into window.__callAnonymizerEffects, which video-effects.js must define
  // first). Setting async = false preserves document-order execution while
  // still not blocking parsing.
  const effectsScript = document.createElement('script');
  effectsScript.src = chrome.runtime.getURL('video-effects.js');
  effectsScript.async = false;
  root.appendChild(effectsScript);

  const injectedScript = document.createElement('script');
  injectedScript.src = chrome.runtime.getURL('injected.js');
  injectedScript.dataset.workletUrl = workletUrl;
  injectedScript.async = false;
  root.appendChild(injectedScript);

  chrome.storage.local.get(
    {
      enabled: true,
      pitchSemitones: 5,
      mode: 'blur',
      intensity: 20,
      puzzleGrid: 4,
      reshuffleNonce: 0,
    },
    (settings) => {
      window.postMessage({ source: 'call-anonymizer', type: 'settings', settings }, '*');
    }
  );

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.source === 'call-anonymizer-popup') {
      window.postMessage(
        { source: 'call-anonymizer', type: 'settings', settings: message.settings },
        '*'
      );
    }
  });
})();
