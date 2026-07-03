const DEFAULTS = { enabled: true, pitchSemitones: 5, blurPx: 20 };

const enabledInput = document.getElementById('enabled');
const enabledLabel = document.getElementById('enabled-label');
const pitchInput = document.getElementById('pitch');
const pitchValue = document.getElementById('pitch-value');
const blurInput = document.getElementById('blur');
const blurValue = document.getElementById('blur-value');

function render(settings) {
  enabledInput.checked = settings.enabled;
  enabledLabel.textContent = settings.enabled ? 'Anonymized' : 'Showing real voice/face';
  pitchInput.value = settings.pitchSemitones;
  pitchValue.textContent = settings.pitchSemitones;
  blurInput.value = settings.blurPx;
  blurValue.textContent = settings.blurPx;
}

function currentSettings() {
  return {
    enabled: enabledInput.checked,
    pitchSemitones: Number(pitchInput.value),
    blurPx: Number(blurInput.value),
  };
}

function save() {
  const settings = currentSettings();
  render(settings);
  chrome.storage.local.set(settings);

  chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { source: 'call-anonymizer-popup', settings });
    }
  });
}

chrome.storage.local.get(DEFAULTS, render);

enabledInput.addEventListener('change', save);
pitchInput.addEventListener('input', save);
blurInput.addEventListener('input', save);
