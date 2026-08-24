const speakBtn = document.getElementById('speakBtn');
const sampleText = document.getElementById('sampleText');

function speakJapanese(text, rate = 0.9) {
  if (!('speechSynthesis' in window)) {
    alert('目前瀏覽器不支援語音合成功能。');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find(v => v.lang?.toLowerCase().startsWith('ja'));
  if (jaVoice) utterance.voice = jaVoice;

  window.speechSynthesis.speak(utterance);
}

speakBtn?.addEventListener('click', () => {
  speakJapanese(sampleText.textContent.trim());
});

document.querySelectorAll('[data-speak]').forEach(button => {
  button.addEventListener('click', () => {
    speakJapanese(button.dataset.speak?.trim() || '');
  });
});

window.speechSynthesis?.addEventListener?.('voiceschanged', () => {});
