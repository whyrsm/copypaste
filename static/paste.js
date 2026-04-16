(async function(){
  while (!window.CopyPasteEditor) await new Promise(r => setTimeout(r, 20));
  var data = JSON.parse(document.getElementById('paste-data').textContent);
  var fallback = document.getElementById('paste-fallback');
  if (fallback) fallback.remove();
  var mount = document.getElementById('editor-mount');
  var wrapper = document.getElementById('editor-wrapper');
  var fsBtn = document.getElementById('fullscreen-btn');
  window.CopyPasteEditor.mount({
    mountEl: mount,
    initialContent: data.content,
    initialLanguage: data.language,
    readOnly: true,
    fullscreenWrapper: wrapper,
    fullscreenButton: fsBtn,
  });
})();

document.getElementById('share-url').textContent = location.href;

function getPasteText() {
  var el = document.getElementById('paste-data');
  if (el) return JSON.parse(el.textContent).content;
  var f = document.querySelector('.paste-content code');
  return f ? f.textContent : '';
}

function trackCopy() {
  wakeServer().then(function() {
    fetch(location.pathname + '/copy', { method: 'POST' });
  });
  var el = document.getElementById('copy-num');
  if (el) el.textContent = String(Number(el.textContent) + 1);
}

function copyContent() {
  const text = getPasteText();
  navigator.clipboard.writeText(text).then(() => {
    trackCopy();
    const btn = document.getElementById('copy-btn');
    btn.querySelector('.copy-icon').style.display = 'none';
    btn.querySelector('.check-icon').style.display = '';
    btn.querySelector('.copy-label').textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.querySelector('.copy-icon').style.display = '';
      btn.querySelector('.check-icon').style.display = 'none';
      btn.querySelector('.copy-label').textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

function copyUrl() {
  navigator.clipboard.writeText(location.href).then(() => {
    const btn = document.getElementById('url-btn');
    btn.querySelector('.url-label').textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.querySelector('.url-label').textContent = 'Copy Link';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// Save to localStorage history if author
(function() {
  if (!window.__isAuthor) return;
  try {
    var KEY = 'copypaste_history';
    var MAX = 50;
    var history = JSON.parse(localStorage.getItem(KEY) || '[]');
    var data = JSON.parse(document.getElementById('paste-data').textContent);
    var slug = location.pathname.slice(1);
    history = history.filter(function(e) { return e.slug !== slug; });
    history.unshift({
      slug: slug,
      language: data.language || 'plaintext',
      createdAt: new Date().toISOString(),
      expiresAt: data.expiresAt || null
    });
    if (history.length > MAX) history = history.slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch(e) {}
})();

window.copyContent = copyContent;
window.copyUrl = copyUrl;
