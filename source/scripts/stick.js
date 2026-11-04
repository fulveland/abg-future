// The events nav follows you down the page.
//
// Both jobs here are enhancements. With this script off the bar still sticks
// — that is plain CSS — it just stays at full height and the headings fall
// back to the scroll-margin the stylesheet guesses for it.
//
//   1. Publish the bar's height as --nav-h, so .grid-head can set a
//      scroll-margin that clears it. Jumping to Tofield has to land on the
//      heading and not underneath the bar. The height changes whenever the
//      rows rewrap, the grid regroups by material, or a filter empties a
//      section, so it is watched rather than measured once.
//
//   2. Flag when the bar is actually stuck, so a phone can compact it. CSS
//      cannot ask "am I stuck?" on its own yet, so this is the usual trick:
//      watch the bar with a 1px negative top margin and it stops counting as
//      fully visible at the exact moment it pins.
//
// The property goes on .panel-inner rather than the document, so a page with
// no bar is left alone and the stylesheet's no-JS fallback stays scoped.
(function () {
  var nav = document.querySelector(".events-nav");
  if (!nav) return;
  var host = nav.closest(".panel-inner") || document.documentElement;

  function measure() {
    host.style.setProperty("--nav-h", nav.offsetHeight + "px");
  }
  measure();

  // ResizeObserver catches every reason the bar changes height — rewrapping,
  // regrouping, a late web font — without this script having to know which
  // of the other scripts did it.
  if ("ResizeObserver" in window) {
    new ResizeObserver(measure).observe(nav);
  } else {
    window.addEventListener("resize", measure);
  }

  if (!("IntersectionObserver" in window)) return;
  new IntersectionObserver(function (entries) {
    nav.classList.toggle("is-stuck", entries[0].intersectionRatio < 1);
  }, { threshold: [1], rootMargin: "-1px 0px 0px 0px" }).observe(nav);
})();
