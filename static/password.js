(function(){
  var form = document.getElementById('pw-form');
  var btn = document.getElementById('pw-btn');
  var label = btn.querySelector('.pw-label');
  form.addEventListener('submit', function(e) {
    if (window.__serverReady) return;
    e.preventDefault();
    label.textContent = 'Waking server...';
    btn.disabled = true;
    wakeServer().then(function() {
      label.textContent = 'Unlock';
      btn.disabled = false;
      form.submit();
    });
  });
})();
