// Service worker: shows an ON/OFF badge on the toolbar icon and handles the
// Alt+Shift+A keyboard shortcut to toggle anonymization without opening the
// popup.

const MEET_AND_ZOOM_PATTERNS = [
  'https://meet.google.com/*',
  'https://zoom.us/wc/*',
  'https://*.zoom.us/wc/*',
];

function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? '#1a7f37' : '#888888' });
}

async function broadcastSettings(settings) {
  for (const pattern of MEET_AND_ZOOM_PATTERNS) {
    const tabs = await chrome.tabs.query({ url: pattern });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { source: 'call-anonymizer-popup', settings });
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ enabled: true }, ({ enabled }) => updateBadge(enabled));
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-anonymize') return;
  const settings = await chrome.storage.local.get({
    enabled: true,
    pitchSemitones: 5,
    mode: 'blur',
    intensity: 20,
    puzzleGrid: 4,
    reshuffleNonce: 0,
  });
  settings.enabled = !settings.enabled;
  await chrome.storage.local.set(settings);
  broadcastSettings(settings);
});
