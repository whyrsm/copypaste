(async function(){
  while (!window.CopyPasteEditor) await new Promise(r => setTimeout(r, 20));
  var mount = document.getElementById('editor-mount');
  var hidden = document.getElementById('content-input');
  var wrapper = document.getElementById('editor-wrapper');
  var fsBtn = document.getElementById('fullscreen-btn');
  var langSel = document.getElementById('language');
  var view = window.CopyPasteEditor.mount({
    mountEl: mount,
    initialContent: '',
    initialLanguage: langSel.value,
    hiddenInput: hidden,
    fullscreenWrapper: wrapper,
    fullscreenButton: fsBtn,
    languageSelect: langSel,
  });
  setTimeout(function(){ view.focus(); }, 50);

  var form = document.getElementById('paste-form');
  var btn = document.getElementById('submit-btn');
  var label = btn.querySelector('.submit-label');
  form.addEventListener('submit', function(e) {
    hidden.value = view.state.doc.toString();
    if (!hidden.value.trim()) {
      e.preventDefault();
      view.focus();
      return;
    }
    if (window.__serverReady) return;
    e.preventDefault();
    label.textContent = 'Waking server...';
    btn.disabled = true;
    wakeServer().then(function() {
      label.textContent = 'Create Paste';
      btn.disabled = false;
      form.submit();
    });
  });
})();

(function(){
  try {
    var KEY = 'copypaste_history';
    var history = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!history.length) return;
    var now = new Date().getTime();
    var container = document.getElementById('recent-pastes');
    var list = document.getElementById('recent-list');
    var items = history.filter(function(e) {
      return !e.expiresAt || new Date(e.expiresAt).getTime() > now;
    }).slice(0, 10);
    if (!items.length) return;
    var h = items.map(function(e) {
      var date = new Date(e.createdAt).toLocaleDateString();
      return '<a href="/' + e.slug + '" class="recent-item">'
        + '<span class="recent-slug">/' + e.slug + '</span>'
        + '<span class="recent-meta">' + (e.language || 'plaintext') + ' \u00b7 ' + date + '</span>'
        + '</a>';
    }).join('');
    list.innerHTML = h;
    container.style.display = '';
  } catch(e) {}
})();
