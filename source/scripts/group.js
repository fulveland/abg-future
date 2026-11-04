// Sort the events page by place, or by material.
//
// The build renders the grid grouped by place, north to south (Cakefile,
// upcomingGroups), with an index of those sections above it and a "Sort by"
// control that starts hidden. This script unhides that control and does the
// other half of the job: regrouping the cards already on the page by their
// data-material, and rewriting the index to match.
//
// It is the browser's job rather than the build's because there is only one
// page: rendering both groupings server-side would mean every card twice.
// With JavaScript off the control never appears and the whole list is still
// there, grouped by place.
//
// It runs after the two scripts that change the grid after the build. The
// build concatenates source/scripts/*.js in filename order, so "group" follows
// "expire" (which removes cards whose day has gone, and then removes headings
// left empty) and "filter" (which hides cards of the wrong type when a type
// filter is on). That order matters: the snapshot taken below has to be of the
// page as expire.js left it, or regrouping would put expired cards back.
(function () {
  // Material sections, in order, with the stored material values each one
  // gathers. Freyja's list, 2026-11-04. The data keeps finer values than this
  // — reed, seagrass, birch bark, textile — so a section can be split out
  // later by adding it here, with nothing re-tagged.
  var MATERIAL_SECTIONS = [
    { slug: "material-willow",   label: "Willow and other sticks", of: ["willow"] },
    { slug: "material-pine",     label: "Pine needles",            of: ["pine needle"] },
    { slug: "material-bark",     label: "Bark",                    of: ["bark", "birch bark"] },
    { slug: "material-cattail",  label: "Cattails",                of: ["cattail", "bulrush"] },
    { slug: "material-broom",    label: "Broom corn",              of: ["broom"] },
    { slug: "material-misc",     label: "Misc",                    of: null }  // null = everything else
  ];

  // The event types with a section of their own at the foot of the page. Which
  // cards belong is decided by the build and written on the card as data-tail;
  // this only holds the order and the wording. Keep in step with TAIL_SECTIONS
  // in the Cakefile. Sorting by material is a question about workshops, so
  // these sections are not broken down by material — they are appended whole.
  var TAIL_SECTIONS = [
    { key: "retreats",  slug: "tail-retreats",  label: "Retreats" },
    { key: "festivals", slug: "tail-festivals", label: "Festivals" },
    { key: "artshows",  slug: "tail-artshows",  label: "Art Shows" }
  ];

  var grid, shopList, otherList, snapshot, mode = "place";

  // Every card on the page, including second copies of the same event.
  function cards() {
    return Array.prototype.slice.call(grid.querySelectorAll(".card[data-material]"));
  }

  // One card per event, in the order the build put them. A section can list
  // an event that another section also lists — Baskets in the Garden belongs
  // under Tofield and under Retreats — so the page may already hold two
  // copies of a card, and regrouping has to start from one of each.
  function sources() {
    var seen = {}, out = [];
    cards().forEach(function (c) {
      var id = c.getAttribute("data-event-id") || "";
      if (id && seen[id]) return;
      if (id) seen[id] = true;
      out.push(c);
    });
    return out;
  }

  // Placing one card in two sections means a copy. Copies are marked so they
  // can be cleared out again, and carry the original's filter state.
  function copyOf(card) {
    var c = card.cloneNode(true);
    c.setAttribute("data-copy", "1");
    c.hidden = card.hidden;
    return c;
  }

  // Misc has no list of its own: it takes whatever no earlier section claimed.
  function sectionTakes(spec, material) {
    return spec.of === null || spec.of.indexOf(material) !== -1;
  }

  // Comma-separated, because material names have spaces in them.
  function attrList(attr, card) {
    var v = card.getAttribute(attr);
    return v ? v.split(",") : [];
  }

  function heading(slug, label) {
    var h = document.createElement("h3");
    h.className = "grid-head";
    h.id = slug;
    h.textContent = label;
    return h;
  }

  // Which sections are on the page now, in order, for whichever grouping is on.
  function sections() {
    var out = [];
    Array.prototype.forEach.call(grid.querySelectorAll(".grid-head"), function (h) {
      out.push({ slug: h.id, label: h.textContent, head: h });
    });
    return out;
  }

  function byPlace() {
    // Clear out the headings and the copies this script made; the snapshot
    // has its own of both.
    dropMade();
    // Put back exactly what the build rendered, in its original order.
    snapshot.forEach(function (node) { grid.appendChild(node); });
  }

  // Anything the build rendered is in the snapshot and must survive a round
  // trip. Headings and card copies this script made are not, and must not
  // pile up on every toggle.
  function dropMade() {
    Array.prototype.forEach.call(
      grid.querySelectorAll('.grid-head, .card[data-copy="1"]'), function (el) {
        if (snapshot.indexOf(el) === -1) el.parentNode.removeChild(el);
      });
  }

  function byMaterial() {
    var secs = MATERIAL_SECTIONS.concat(TAIL_SECTIONS).map(function (spec) {
      return { spec: spec, items: [] };
    });
    function add(i, card) {
      if (secs[i].items.indexOf(card) === -1) secs[i].items.push(card);
    }

    sources().forEach(function (card) {
      // Each material the event is made of puts it in that section, so a
      // willow-and-whatever open weave shows under Willow and under Misc.
      var tails = attrList("data-tail", card);
      if (tails.length) {
        // A retreat, festival or art show keeps its own section and is not
        // also filed under a material.
        tails.forEach(function (t) {
          for (var j = 0; j < TAIL_SECTIONS.length; j++) {
            if (TAIL_SECTIONS[j].key === t) { add(MATERIAL_SECTIONS.length + j, card); return; }
          }
        });
        return;
      }
      // Each material the event is made of puts it in that section, so a
      // willow-and-whatever open weave shows under Willow and under Misc.
      var mats = attrList("data-material", card);
      if (!mats.length) mats = [""];
      mats.forEach(function (m) {
        for (var i = 0; i < MATERIAL_SECTIONS.length; i++) {
          if (sectionTakes(MATERIAL_SECTIONS[i], m)) { add(i, card); return; }
        }
      });
    });

    dropMade();
    // Take the build's headings off too; the cards go back under headings of
    // this grouping's own. The snapshot still holds them for the trip back.
    Array.prototype.forEach.call(grid.querySelectorAll(".grid-head"), function (h) {
      h.parentNode.removeChild(h);
    });

    var used = {};
    secs.forEach(function (b) {
      if (!b.items.length) return;
      grid.appendChild(heading(b.spec.slug, b.spec.label));
      b.items.forEach(function (card) {
        var id = card.getAttribute("data-event-id") || "";
        // The first section to claim a card gets the card; the rest get copies.
        if (id && used[id]) { grid.appendChild(copyOf(card)); return; }
        if (id) used[id] = true;
        grid.appendChild(card);
      });
    });
    // The Request / Submit / Promote row belongs at the end, whatever the order.
    var cta = grid.querySelector(".cta-row");
    if (cta) grid.appendChild(cta);
  }

  // A heading whose cards are all hidden by the type filter should go too, and
  // so should its index link. filter.js does this for the place headings it
  // knows about; after a regroup the headings are new, so redo it here.
  function hideEmptyHeadings() {
    Array.prototype.forEach.call(grid.querySelectorAll(".grid-head"), function (head) {
      var any = false;
      var node = head.nextElementSibling;
      while (node && !node.classList.contains("grid-head")) {
        if (node.classList.contains("card") && !node.hidden &&
            node.getAttribute("data-type")) { any = true; break; }
        node = node.nextElementSibling;
      }
      // With no filter on, every heading that still exists is wanted.
      head.hidden = anyFilterActive() ? !any : false;
    });
  }

  function anyFilterActive() {
    var pressed = document.querySelector('button.type-filter[aria-pressed="true"]');
    return !!pressed;
  }

  function fill(ul, items) {
    if (!ul) return;
    ul.innerHTML = "";
    items.forEach(function (s) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + s.slug;
      a.setAttribute("data-area-link", s.slug);
      a.textContent = s.label;
      li.appendChild(a);
      ul.appendChild(li);
    });
  }

  // Two indexes, because they answer different questions: one walks the
  // workshops however they are grouped at the moment, the other goes straight
  // to the retreats, festivals and art shows at the foot of the page.
  //
  // The second one always lists all three, in the same order, whether or not
  // anything is coming up. One with nothing behind it is plain text rather
  // than a link into an empty section.
  function drawIndex() {
    var live = sections().filter(function (s) { return !s.head.hidden; });
    var shop = live.filter(function (s) { return s.slug.indexOf("tail-") !== 0; });
    // One way of slicing the workshops is not a list worth offering.
    fill(shopList, shop.length > 1 ? shop : []);

    if (!otherList) return;
    otherList.innerHTML = "";
    TAIL_SECTIONS.forEach(function (spec) {
      var here = null;
      live.forEach(function (s) { if (s.slug === spec.slug) here = s; });
      var li = document.createElement("li");
      var el;
      if (here) {
        el = document.createElement("a");
        el.href = "#" + spec.slug;
        el.setAttribute("data-area-link", spec.slug);
      } else {
        el = document.createElement("span");
        el.className = "nav-empty";
        el.setAttribute("data-area-empty", spec.slug);
      }
      el.textContent = spec.label;
      li.appendChild(el);
      otherList.appendChild(li);
    });
  }

  function render() {
    if (mode === "material") byMaterial(); else byPlace();
    hideEmptyHeadings();
    drawIndex();
  }

  function start() {
    grid = document.querySelector('.card-grid[data-filter-scope="all"]');
    if (!grid) return;
    shopList  = document.querySelector('.area-index[data-nav="workshops"] ul');
    otherList = document.querySelector('.area-index[data-nav="other"] ul');

    // The page as expire.js left it. Everything else is rearranging these.
    snapshot = Array.prototype.slice.call(grid.children);

    var control = document.querySelector(".sort-by");
    var opts = document.querySelectorAll("button.sort-opt");
    if (!opts.length) return;

    // Nothing to sort by material if every card lands in one section.
    var used = {};
    sources().forEach(function (c) {
      attrList("data-tail", c).forEach(function (t) { used["tail-" + t] = true; });
      if (attrList("data-tail", c).length) return;
      var mats = attrList("data-material", c);
      if (!mats.length) mats = [""];
      mats.forEach(function (m) {
        for (var i = 0; i < MATERIAL_SECTIONS.length; i++) {
          if (sectionTakes(MATERIAL_SECTIONS[i], m)) { used[MATERIAL_SECTIONS[i].slug] = true; return; }
        }
      });
    });
    if (Object.keys(used).length < 2) return;

    if (control) control.hidden = false;

    Array.prototype.forEach.call(opts, function (b) {
      b.addEventListener("click", function () {
        var want = b.getAttribute("data-sort");
        if (want === mode) return;
        mode = want;
        Array.prototype.forEach.call(opts, function (o) {
          o.setAttribute("aria-pressed", String(o.getAttribute("data-sort") === mode));
        });
        render();
      });
    });

    // The type filter hides and shows cards; the headings and the index follow.
    window.addEventListener("abg:filterchange", function () {
      hideEmptyHeadings();
      drawIndex();
    });

    drawIndex();
  }

  if (document.readyState !== "loading") start();
  else document.addEventListener("DOMContentLoaded", start);
})();
