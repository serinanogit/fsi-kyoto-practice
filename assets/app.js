const speakBtn = document.getElementById('speakBtn');
const sampleText = document.getElementById('sampleText');
const buddyBtn = document.getElementById('buddyBtn');
const buddyLine = document.getElementById('buddyLine');
const mascot = document.querySelector('.mascot');

const buddyLines = [
  '先做一題就好。完成比完美重要。',
  '今天卡住的地方，之後會變成最值得回收的題目。',
  '先自己想，再看提示。這樣才是在練 retrieval。',
  '一小段也算進步。每天能回來最重要。',
  '答錯沒關係，下一輪我們把任務縮小再來。'
];

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

buddyBtn?.addEventListener('click', () => {
  const current = buddyLine.textContent;
  const options = buddyLines.filter(line => line !== current);
  buddyLine.textContent = options[Math.floor(Math.random() * options.length)];
  mascot.classList.remove('bounce');
  void mascot.offsetWidth;
  mascot.classList.add('bounce');
});

window.speechSynthesis?.addEventListener?.('voiceschanged', () => {});
