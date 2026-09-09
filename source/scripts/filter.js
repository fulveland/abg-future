// Event type filter.
//
// The words "Open weaves", "Workshops" and "Retreats" in the events intro used
// to be <a> tags with no href — they looked like links and did nothing. They are
// now buttons that filter the cards below to that one kind of event, on both the
// home carousel and the events page grid.
//
// Cards carry data-type (set in the Cakefile from events.json). Anything without
// a data-type — the "Find more events" / "Request a workshop" CTA cards — is
// left alone, so the calls to action never disappear.
//
// Scope matters. The events page renders every upcoming event, so it filters in
// place; its grid is marked data-filter-scope="all". The home carousel only
// holds six cards and drops sold-out ones, so filtering it there would quietly
// show 2 of 5 retreats. On any page without the marker the buttons navigate to
// /events#<type> instead, and the events page applies that hash on load.
(function () {
  function initFilters() {
    var buttons = document.querySelectorAll("button.type-filter");
    if (!buttons.length) return;

    // The card containers on this page: the home deck and/or the events grid.
    var containers = document.querySelectorAll(".deck, .card-grid");
    if (!containers.length) return;

    var active = null;
    var status = null;

    function statusEl() {
      if (status) return status;
      status = document.createElement("p");
      status.className = "filter-status";
      status.setAttribute("role", "status");
      var first = containers[0];
      var anchor = first.closest(".deck-wrap") || first;
      anchor.parentNode.insertBefore(status, anchor);
      return status;
    }

    function label(type) {
      if (type === "open weave") return "open weaves";
      if (type === "retreat") return "retreats";
      if (type === "workshop") return "workshops";
      return type;
    }

    function apply() {
      var shown = 0;

      Array.prototype.forEach.call(containers, function (box) {
        var cards = box.querySelectorAll(".card");
        Array.prototype.forEach.call(cards, function (card) {
          var t = card.getAttribute("data-type");
          // Untyped cards (the CTAs) always stay.
          var show = !active || !t || t === active;
          card.hidden = !show;
          if (show && t) shown++;
        });

        // Category headings on the events page: hide any whose group is now empty.
        var heads = box.querySelectorAll(".grid-head");
        Array.prototype.forEach.call(heads, function (head) {
          var any = false;
          var node = head.nextElementSibling;
          while (node && !node.classList.contains("grid-head")) {
            if (node.classList.contains("card") && !node.hidden &&
                node.getAttribute("data-type")) { any = true; break; }
            node = node.nextElementSibling;
          }
          head.hidden = active ? !any : false;
        });
      });

      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === active));
      });

      if (!active) {
        if (status) status.hidden = true;
      } else {
        var el = statusEl();
        el.hidden = false;
        el.innerHTML = shown
          ? "Showing " + label(active) + " only. <button type=\"button\" class=\"filter-clear\">Show everything</button>"
          : "No " + label(active) + " listed right now. <button type=\"button\" class=\"filter-clear\">Show everything</button>";
      }

      // Let the carousel recalculate its arrows and go back to the start.
      Array.prototype.forEach.call(document.querySelectorAll(".deck"), function (d) {
        d.scrollLeft = 0;
      });
      window.dispatchEvent(new Event("resize"));
    }

    // A filter with nothing behind it is a dead end, so leave it as plain
    // emphasised text instead of a button you can click into an empty result.
    // It wakes up on its own as soon as an event of that kind is listed.
    function countFor(type) {
      var n = 0;
      Array.prototype.forEach.call(containers, function (box) {
        n += box.querySelectorAll('.card[data-type="' + type + '"]').length;
      });
      return n;
    }

    // Is this page showing the complete list, or only a teaser of it?
    var isFullList = !!document.querySelector('[data-filter-scope="all"]');

    Array.prototype.forEach.call(buttons, function (b) {
      var want = b.getAttribute("data-filter");

      if (!countFor(want)) {
        b.disabled = true;
        b.setAttribute("data-empty", "true");
        b.removeAttribute("aria-pressed");
        return;
      }
      b.addEventListener("click", function () {
        active = (active === want) ? null : want;
        apply();
      });
    });

    document.addEventListener("click", function (e) {
      if (e.target && e.target.classList.contains("filter-clear")) {
        active = null;
        apply();
      }
    });

    // Arriving from the home page: /events#retreat
    function fromHash() {
      if (!isFullList) return;
      var want = (window.location.hash || "").replace(/^#/, "").replace(/-/g, " ");
      if (!want) return;
      var match = null;
      Array.prototype.forEach.call(buttons, function (b) {
        if (b.getAttribute("data-filter") === want) match = want;
      });
      if (match) {
        active = match;
        apply();
        var head = document.querySelector(".filter-status");
        if (head && head.scrollIntoView) head.scrollIntoView({ block: "center" });
      }
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
  }

  if (document.readyState !== "loading") initFilters();
  else document.addEventListener("DOMContentLoaded", initFilters);
})();
