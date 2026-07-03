const DEFAULTS = {
  enabled: true,
  pitchSemitones: 5,
  mode: 'blur',
  intensity: 20,
  puzzleGrid: 4,
  reshuffleNonce: 0,
};

const enabledInput = document.getElementById('enabled');
const enabledLabel = document.getElementById('enabled-label');
const pitchInput = document.getElementById('pitch');
const pitchValue = document.getElementById('pitch-value');
const modeInput = document.getElementById('mode');
const intensityRow = document.getElementById('intensity-row');
const intensityInput = document.getElementById('intensity');
const intensityValue = document.getElementById('intensity-value');
const puzzleRow = document.getElementById('puzzle-row');
const puzzleGridInput = document.getElementById('puzzle-grid');
const puzzleGridValue = document.getElementById('puzzle-grid-value');
const puzzleGridValue2 = document.getElementById('puzzle-grid-value-2');
const reshuffleButton = document.getElementById('reshuffle');

let reshuffleNonce = DEFAULTS.reshuffleNonce;

function render(settings) {
  enabledInput.checked = settings.enabled;
  enabledLabel.textContent = settings.enabled ? 'Anonymized' : 'Showing real voice/face';
  pitchInput.value = settings.pitchSemitones;
  pitchValue.textContent = settings.pitchSemitones;
  modeInput.value = settings.mode;
  intensityInput.value = settings.intensity;
  intensityValue.textContent = settings.intensity;
  puzzleGridInput.value = settings.puzzleGrid;
  puzzleGridValue.textContent = settings.puzzleGrid;
  puzzleGridValue2.textContent = settings.puzzleGrid;
  reshuffleNonce = settings.reshuffleNonce;

  const isPuzzle = settings.mode === 'puzzle';
  intensityRow.style.display = isPuzzle ? 'none' : 'block';
  puzzleRow.style.display = isPuzzle ? 'block' : 'none';
  reshuffleButton.style.display = isPuzzle ? 'block' : 'none';
}

function currentSettings() {
  return {
    enabled: enabledInput.checked,
    pitchSemitones: Number(pitchInput.value),
    mode: modeInput.value,
    intensity: Number(intensityInput.value),
    puzzleGrid: Number(puzzleGridInput.value),
    reshuffleNonce,
  };
}

function save() {
  const settings = currentSettings();
  render(settings);
  chrome.storage.local.set(settings);

  chrome.tabs.query(
    {
      url: ['https://meet.google.com/*', 'https://zoom.us/wc/*', 'https://*.zoom.us/wc/*'],
    },
    (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { source: 'call-anonymizer-popup', settings });
      }
    }
  );
}

chrome.storage.local.get(DEFAULTS, render);

enabledInput.addEventListener('change', save);
pitchInput.addEventListener('input', save);
modeInput.addEventListener('change', save);
intensityInput.addEventListener('input', save);
puzzleGridInput.addEventListener('input', save);
reshuffleButton.addEventListener('click', () => {
  reshuffleNonce += 1;
  save();
});
