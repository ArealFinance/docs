// Auto-resize embedded widget iframes (.wfr) to their content height.
// Each widget posts { type: "wf-height", height } via postMessage.
window.addEventListener("message", function (e) {
  var d = e.data;
  if (!d || d.type !== "wf-height" || !d.height) return;
  var frames = document.querySelectorAll("iframe.wfr");
  for (var i = 0; i < frames.length; i++) {
    if (frames[i].contentWindow === e.source) {
      frames[i].style.height = d.height + "px";
      break;
    }
  }
});
