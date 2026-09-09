// Card deck carousels: wire up prev/next buttons and toggle
// edge classes so arrows hide at the start/end or when nothing scrolls.
(function () {
  function initDecks() {
    var wraps = document.querySelectorAll(".deck-wrap");
    Array.prototype.forEach.call(wraps, function (wrap) {
      var deck = wrap.querySelector(".deck");
      if (!deck) return;
      var prev = wrap.querySelector(".deck-nav.prev");
      var next = wrap.querySelector(".deck-nav.next");

      function step() {
        var card = deck.querySelector(".card, .deck > *");
        var gap = parseFloat(getComputedStyle(deck).columnGap) || 16;
        var w = card ? card.getBoundingClientRect().width : 240;
        return w + gap;
      }

      if (prev) prev.addEventListener("click", function () {
        deck.scrollBy({ left: -step(), behavior: "smooth" });
      });
      if (next) next.addEventListener("click", function () {
        deck.scrollBy({ left: step(), behavior: "smooth" });
      });

      function update() {
        var max = deck.scrollWidth - deck.clientWidth - 1;
        wrap.classList.toggle("at-start", deck.scrollLeft <= 0);
        wrap.classList.toggle("at-end", deck.scrollLeft >= max);
        wrap.classList.toggle("no-scroll", deck.scrollWidth <= deck.clientWidth + 1);
      }

      deck.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      window.addEventListener("load", update);
      setTimeout(update, 300);
      update();
    });
  }

  if (document.readyState !== "loading") initDecks();
  else document.addEventListener("DOMContentLoaded", initDecks);
})();
