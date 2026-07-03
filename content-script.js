// Runs in the isolated world. Injects injected.js into the page's main
// world (needed to override getUserMedia/RTCPeerConnection before Meet's
// own code runs) and relays settings between the popup and the page.

(function () {
  const injectedUrl = chrome.runtime.getURL('injected.js');
  const workletUrl = chrome.runtime.getURL('audio-processor.js');

  const script = document.createElement('script');
  script.src = injectedUrl;
  script.dataset.workletUrl = workletUrl;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  chrome.storage.local.get(
    { enabled: true, pitchSemitones: 5, blurPx: 20 },
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
