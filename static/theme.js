(function(){
  var btn = document.getElementById('theme-toggle');
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
  btn.addEventListener('click', function(){
    var current = document.documentElement.getAttribute('data-theme');
    if (!current) {
      current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    apply(current === 'dark' ? 'light' : 'dark');
  });

  // Wake-up helper for Railway sleeping servers
  window.__serverReady = false;
  window.__wakePromise = null;
  function wakeServer() {
    if (window.__serverReady) return Promise.resolve();
    if (window.__wakePromise) return window.__wakePromise;
    window.__wakePromise = fetch('/health', { method: 'GET' })
      .then(function() { window.__serverReady = true; })
      .catch(function() { window.__serverReady = true; })
      .finally(function() { window.__wakePromise = null; });
    return window.__wakePromise;
  }
  // Wake on page load
  wakeServer();
  // Re-wake when user returns to tab after being away
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      window.__serverReady = false;
      wakeServer();
    }
  });
  window.wakeServer = wakeServer;
})();
