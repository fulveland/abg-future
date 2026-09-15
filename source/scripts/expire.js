// Drop events whose day has gone by — in the visitor's browser.
//
// Upcoming vs Past is decided at BUILD time (Cakefile, upcomingCards) against
// buildDate(). Between builds the page drifts: a workshop that finished
// yesterday keeps sitting under "Upcoming" until someone rebuilds the site.
// This runs the same test again on every page load, against the visitor's own
// calendar date, and takes out the cards that have gone by. Nothing to keep
// up by hand.
//
// Cards carry data-until — the last day the event is still on (date.end, or
// date.start for a single day), written by the Cakefile. Anything without
// data-until is never touched: recurring events ("Third Tuesday of each
// month"), ongoing opportunities, and the Request / Submit / Promote cards.
//
// Cards are REMOVED rather than hidden, so the type filter's counts and the
// carousel's scroll measurements only ever see what is actually on the page.
// This file must run BEFORE filter.js — the build concatenates
// source/scripts/*.js in filename order, and "expire" sorts before "filter".
//
// What this does NOT do: the cards are still in the HTML the server sends, so
// a crawler, or a visitor with JavaScript off, sees the build-time list. It
// trims the page as shown; it is not a replacement for rebuilding the site.
// It also cannot pull a seventh event into the home carousel to replace one it
// removed — the build only wrote six cards.
(function () {
  function today() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() +
      "-" + (m < 10 ? "0" : "") + m +
      "-" + (day < 10 ? "0" : "") + day;
  }

  // Walk from a category heading to the next one, looking for a card that is
  // still standing. Same shape as the filter's heading check.
  function groupHasCards(head) {
    var node = head.nextElementSibling;
    while (node && !node.classList.contains("grid-head")) {
      if (node.classList.contains("card") && !node.classList.contains("card--cta")) return true;
      node = node.nextElementSibling;
    }
    return false;
  }

  function expire() {
    var now = today();
    var stale = [];

    Array.prototype.forEach.call(document.querySelectorAll(".card[data-until]"), function (card) {
      var until = card.getAttribute("data-until");
      // Anything that is not a plain YYYY-MM-DD is left alone rather than guessed at.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return;
      if (until >= now) return;
      stale.push(card);
    });

    if (!stale.length) return;

    var touched = [];
    stale.forEach(function (card) {
      var box = card.closest(".deck, .card-grid");
      if (box && touched.indexOf(box) === -1) touched.push(box);
      card.parentNode.removeChild(card);
    });

    // Category headings with nothing left underneath them.
    Array.prototype.forEach.call(document.querySelectorAll(".grid-head"), function (head) {
      if (!groupHasCards(head)) head.parentNode.removeChild(head);
    });

    // A container that has emptied out says so, where the page gave it wording.
    touched.forEach(function (box) {
      if (box.querySelector(".card:not(.card--cta)")) return;
      if (box.querySelector(".empty")) return;
      var msg = box.getAttribute("data-empty-message");
      if (!msg) return;
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = msg;
      box.insertBefore(p, box.firstChild);
    });

    // Let the carousels re-measure now that cards have gone.
    window.dispatchEvent(new Event("resize"));
  }

  if (document.readyState !== "loading") expire();
  else document.addEventListener("DOMContentLoaded", expire);
})();
