/*! My Toolbox Loader v1.0.0 */
(function(){
  if (window.__mtbLoaded) return; window.__mtbLoaded = true;

  // Figure out BASE from the script’s own src (e.g. https://proagency.github.io/my-toolbox/embed.js)
  var currentScript = document.currentScript || (function(){
    var s = document.getElementsByTagName('script'); return s[s.length-1];
  })();
  var src = currentScript && currentScript.src || "";
  var BASE = src.replace(/[^/]+$/, ""); // strip filename → keep trailing slash

  // Read optional data- overrides from the script tag
  var cfg = {
    otpUrl:      currentScript?.dataset.otpUrl || "",
    agentUrl:    currentScript?.dataset.agentUrl || "",
    reviewUrl:   currentScript?.dataset.reviewUrl || "",
    uploadUrl:   currentScript?.dataset.uploadUrl || "",
    bookingUrl:  currentScript?.dataset.bookingUrl || "",
    resultsUrl:  currentScript?.dataset.resultsUrl || ""
  };

  // Ensure #mtbRoot exists (and pass overrides via dataset + global)
  var root = document.getElementById('mtbRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'mtbRoot';
    root.style.display = 'none';
    document.body.appendChild(root);
  }
  // Put overrides on root for app consumption (if your app.js reads dataset),
  // and also on a global shim window.__MTB_OVERRIDES (no changes needed if app.js looks for this).
  Object.entries({
    otpUrl: cfg.otpUrl, agentUrl: cfg.agentUrl, reviewUrl: cfg.reviewUrl,
    uploadUrl: cfg.uploadUrl, bookingUrl: cfg.bookingUrl, resultsUrl: cfg.resultsUrl
  }).forEach(([k,v]) => { if (v) root.dataset[k.replace(/Url$/,'-url')] = v; });
  window.__MTB_OVERRIDES = cfg; // optional global for app.js to use

  // Helper: add element once by id
  function addOnce(id, el){ if(document.getElementById(id)) return; el.id=id; (el.tagName==='SCRIPT'?document.body:document.head).appendChild(el); }

  // Fonts + Icons (once)
  var l1=document.createElement('link'); l1.rel='preconnect'; l1.href='https://fonts.googleapis.com'; addOnce('mtb-gf-preconnect-1', l1);
  var l2=document.createElement('link'); l2.rel='preconnect'; l2.href='https://fonts.gstatic.com'; l2.crossOrigin='anonymous'; addOnce('mtb-gf-preconnect-2', l2);
  var gf=document.createElement('link'); gf.rel='stylesheet'; gf.href='https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap'; addOnce('mtb-gf-montserrat', gf);
  var fa=document.createElement('link'); fa.rel='stylesheet'; fa.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'; addOnce('mtb-fa6', fa);

  // Widget CSS
  var css=document.createElement('link'); css.rel='stylesheet'; css.href=BASE+'style.css'; addOnce('mtb-style', css);

  // Widget JS (defer). If app.js supports overrides, it can read window.__MTB_OVERRIDES.
  var js=document.createElement('script'); js.defer=true; js.src=BASE+'app.js'; addOnce('mtb-script', js);
})();
