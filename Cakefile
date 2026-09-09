path = require "path"
require "sweetbread"


# EVENTS (build-time card generation) ############################################################
# Reads source/data/*.json and expands tokens in pages:
#   {{EVENTS_UPCOMING}}      -> all upcoming event cards
#   {{EVENTS_UPCOMING:6}}    -> up to 6 upcoming event cards
#   {{EVENTS_PAST}}          -> past-event cards
# Cards reuse the same .card markup as the rest of the site; events with no
# photo (image: null) fall back to the willow placeholder.

esc = (s)->
  String(if s? then s else "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

readJSON = (p)->
  try
    JSON.parse read p
  catch e
    null

buildDate = -> new Date().toISOString().slice(0, 10)

# PAGE META ######################################################################
# Every page carries a leading <!--META ... --> block of `key: value` lines.
# The build strips it off and fills the placeholders in _template.html, so each
# page gets its own <title>, description, canonical URL and Open Graph tags.
# Without these a shared link renders as a bare grey box on Facebook, which is
# where most of our traffic comes from.

SITE_URL          = "https://albertabasketryguild.com"
DEFAULT_TITLE     = "Alberta Basketry Guild"
DEFAULT_IMAGE     = "/assets/og-card.jpg"
DEFAULT_IMAGE_ALT = "Alberta Basketry Guild \u2014 a community of weavers, teaching and learning across Alberta."

pageMeta = (html)->
  meta = {}
  body = html.replace /^\s*<!--\s*META\b([\s\S]*?)-->\s*/, (m, block)->
    for line in block.split("\n")
      i = line.indexOf ":"
      continue if i < 1
      key = line.slice(0, i).trim()
      val = line.slice(i + 1).trim()
      meta[key] = val if key and val
    ""
  { meta, body }

# "public/events/index.html" -> "https://albertabasketryguild.com/events/"
canonicalFor = (dest)->
  p = dest.replace(/^public/, "").replace(/index\.html$/, "")
  p = "/" if p is ""
  SITE_URL + p

applyMeta = (html, meta, dest)->
  title = meta.title or DEFAULT_TITLE
  img   = meta.image or DEFAULT_IMAGE
  img   = SITE_URL + img if img.charAt(0) is "/"
  html = html.replace /\{\{TITLE\}\}/g,       -> esc title
  html = html.replace /\{\{DESCRIPTION\}\}/g, -> esc(meta.description or "")
  html = html.replace /\{\{CANONICAL\}\}/g,   -> esc canonicalFor dest
  html = html.replace /\{\{IMAGE\}\}/g,       -> esc img
  html = html.replace /\{\{IMAGE_ALT\}\}/g,   -> esc(meta.imageAlt or DEFAULT_IMAGE_ALT)
  html

willowPlaceholder = '<div class="card-media" role="img" aria-label="Photo coming soon"><svg class="willow" aria-hidden="true"><use href="#willow"></use></svg></div>'

mediaHTML = (ev)->
  if ev.image
    # Prefer a hand-written imageAlt describing the photo; fall back to the
    # workshop name so the image is never announced as unlabelled.
    alt = ev.imageAlt or ev.workshopName or ""
    '<img src="/assets/event-photos/' + esc(ev.image) + '" alt="' + esc(alt) + '">'
  else
    willowPlaceholder

registrationHTML = (r)->
  return "" unless r
  switch r.type
    when "link"      then '<a class="reg" href="' + esc(r.url) + '">More info</a>'
    when "waitlist"  then '<a class="reg" href="' + esc(r.url) + '">Join waitlist</a>'
    when "instagram" then '<a class="reg" href="' + esc(r.url) + '">Send DM</a>'
    when "email"
      if r.host
        '<p class="reg">Register by contacting ' + esc(r.host) + ' at <a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></p>'
      else
        '<p class="reg">Register by emailing <a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></p>'
    else ""

# Names whoever is behind the entry. Workshops credit the instructor; entries
# with no instructor — a school's own listing, a gallery exhibit, a standing
# open weave — credit the host instead, the same fallback past cards use.
eventWhoHTML = (ev)->
  if ev.teacher
    '<p class="teacher">With ' + esc(ev.teacher) + '</p>'
  else if ev.host
    '<p class="teacher">Hosted by ' + esc(ev.host) + '</p>'
  else
    ""

eventCard = (ev)->
  teacher = eventWhoHTML ev
  badge = if ev.soldOut then '<span class="badge">Sold out</span>' else ""
  [
    '<article class="card">'
    mediaHTML ev
    '<div class="card-body">'
    badge
    '<h3>' + esc(ev.workshopName) + '</h3>'
    '<p>' + esc(ev.date.display) + '</p>'
    '<p>' + esc(ev.area) + '</p>'
    '<p>' + esc(ev.location) + '</p>'
    teacher
    registrationHTML ev.registration
    '</div>'
    '</article>'
  ].join "\n"

# Past cards name whoever ran the workshop, so people know who to approach
# about a repeat. Instructor first, then the host, then whoever was handling
# registration.
pastWhoHTML = (ev)->
  r = ev.registration or {}
  c = ev.contact or {}
  if ev.teacher
    '<p class="teacher">With ' + esc(ev.teacher) + '</p>'
  else if ev.host or c.name or r.host
    '<p class="teacher">Hosted by ' + esc(ev.host or c.name or r.host) + '</p>'
  else
    ""

# A way to actually reach them about a repeat. Prefers `contact`, which is who
# to approach NOW; `registration` is the historical record of how people signed
# up at the time, and is only used as a fallback. Only links an email that looks
# like an address — some entries carry a malformed one.
pastContactHTML = (ev)->
  c = ev.contact or {}
  r = ev.registration or {}
  if c.type is "email" and c.email
    '<a class="reg" href="mailto:' + esc(c.email) + '">' + esc(c.label or "Email about a repeat") + '</a>'
  else if c.type is "link" and c.url
    '<a class="reg" href="' + esc(c.url) + '">' + esc(c.label or "See their events") + '</a>'
  else if c.type is "instagram" and c.url
    '<a class="reg" href="' + esc(c.url) + '">Send DM</a>'
  else if r.type is "instagram" and r.url
    '<a class="reg" href="' + esc(r.url) + '">Send DM</a>'
  else if r.type is "email" and r.email and r.email.indexOf("@") > 0
    '<a class="reg" href="mailto:' + esc(r.email) + '">Email about a repeat</a>'
  else
    ""

pastCard = (ev)->
  albums = (ev.photoAlbums or []).map((a)-> '<a class="reg" href="' + esc(a.url) + '">' + esc(a.title) + '</a>').join "\n"
  [
    '<article class="card">'
    mediaHTML ev
    '<div class="card-body">'
    '<h3>' + esc(ev.workshopName) + '</h3>'
    '<p>' + esc(ev.date.display) + '</p>'
    '<p>' + esc(ev.area) + '</p>'
    pastWhoHTML ev
    albums
    pastContactHTML ev
    '</div>'
    '</article>'
  ].join "\n"

byStart = (a, b)->
  as = a.date?.start or "9999"
  bs = b.date?.start or "9999"
  if as < bs then -1 else if as > bs then 1 else 0

CATEGORY_ORDER = [
  "Guild Events"
  "Community Events"
  "Festivals"
  "Art Shows"
  "Craft Sale"
  "Calls for Submission"
]

upcomingCards = (limit)->
  data = readJSON "source/data/events.json"
  return "" unless data?.events
  today = buildDate()
  evs = data.events.filter (e)->
    e.date?.recurring or ((e.date?.end or e.date?.start or "9999") >= today)
  evs.sort byStart
  return '<p class="empty">No upcoming events right now &mdash; check back soon.</p>' if evs.length is 0
  # Limited call (the home page carousel) stays a flat run of cards, and drops
  # sold-out events — the carousel is a teaser, so it should only show things
  # people can still book. The full events page still lists them.
  if limit
    live = evs.filter (e)-> not e.soldOut
    return '<p class="empty">No upcoming events right now &mdash; check back soon.</p>' if live.length is 0
    return live.slice(0, limit).map(eventCard).join "\n"
  # Unlimited call (the events page grid) groups by doc category, with a
  # full-width heading before each group. .grid-head spans the grid row, so
  # this still lives inside the page's single .card-grid.
  present = []
  for e in evs
    cat = e.category or "Community Events"
    present.push cat unless cat in present
  ordered = CATEGORY_ORDER.filter (c)-> c in present
  ordered = ordered.concat present.filter (c)-> c not in CATEGORY_ORDER
  out = []
  for cat in ordered
    out.push '<h3 class="grid-head">' + esc(cat) + '</h3>'
    out.push evs.filter((e)-> (e.category or "Community Events") is cat).map(eventCard).join("\n")
  out.join "\n"

pastCards = ->
  data = readJSON "source/data/past-events.json"
  evs = data?.pastEvents or []
  return '<p class="empty">Past event highlights will appear here.</p>' if evs.length is 0
  evs.sort (a, b)->
    return -1 if a.highlight and not b.highlight
    return 1 if b.highlight and not a.highlight
    as = a.date?.start or ""
    bs = b.date?.start or ""
    if bs < as then -1 else if bs > as then 1 else 0
  evs.map(pastCard).join "\n"

# OPPORTUNITIES ##################################################################
# Reads source/data/opportunities.json. Same card markup as events, but the
# entries are calls for people rather than workshops to book.
#   {{OPPORTUNITIES}}    -> all current opportunities
#   {{OPPORTUNITIES:3}}  -> up to 3

contactHTML = (c) ->
  return "" unless c
  switch c.type
    when "email"
      return "" unless c.email and c.email.indexOf("@") > 0
      '<a class="reg" href="mailto:' + esc(c.email) + '">' + esc(c.label or "Get in touch") + '</a>'
    when "link"
      return "" unless c.url
      '<a class="reg" href="' + esc(c.url) + '">' + esc(c.label or "More info") + '</a>'
    when "instagram"
      return "" unless c.url
      '<a class="reg" href="' + esc(c.url) + '">' + esc(c.label or "Send DM") + '</a>'
    else ""

opportunityCard = (op)->
  badge   = if op.kind then '<span class="badge badge--kind">' + esc(op.kind) + '</span>' else ""
  loc     = if op.location then '<p>' + esc(op.location) + '</p>' else ""
  from    = if op.organizer then '<p class="teacher">From ' + esc(op.organizer) + '</p>' else ""
  summary = if op.summary then '<p>' + esc(op.summary) + '</p>' else ""
  [
    '<article class="card">'
    mediaHTML op
    '<div class="card-body">'
    badge
    '<h3>' + esc(op.title) + '</h3>'
    '<p>' + esc(op.date?.display or "") + '</p>'
    '<p>' + esc(op.area or "") + '</p>'
    loc
    from
    summary
    contactHTML op.contact
    '</div>'
    '</article>'
  ].filter((s)-> s isnt "").join "\n"

opportunityCards = (limit)->
  data = readJSON "source/data/opportunities.json"
  ops = data?.opportunities or []
  today = buildDate()
  ops = ops.filter (o)->
    o.date?.ongoing or ((o.date?.end or o.date?.start or "9999") >= today)
  # dated entries first, soonest first; ongoing ones last
  ops.sort (a, b)->
    ao = if a.date?.ongoing then 1 else 0
    bo = if b.date?.ongoing then 1 else 0
    return ao - bo if ao isnt bo
    byStart a, b
  ops = ops.slice(0, limit) if limit
  return "" if ops.length is 0        # the "post an opportunity" card carries the section
  ops.map(opportunityCard).join "\n"

# NEWSLETTERS ####################################################################
# Reads source/data/newsletters.json — the Buttondown archive, listed by hand.
#   {{NEWSLETTERS}}     -> every issue
#   {{NEWSLETTERS:6}}   -> the most recent 6

newsletterItems = (limit)->
  data = readJSON "source/data/newsletters.json"
  items = data?.newsletters or []
  items.sort (a, b)->
    ap = a.date?.published or ""
    bp = b.date?.published or ""
    if bp < ap then -1 else if bp > ap then 1 else 0
  items = items.slice(0, limit) if limit
  return '<p class="empty">Past newsletters will appear here.</p>' if items.length is 0
  rows = items.map (n)->
    '<li><a href="' + esc(n.url) + '">' + esc(n.title) + '</a>' +
    '<span class="archive-date">' + esc(n.date?.display or "") + '</span></li>'
  '<ul class="archive">' + rows.join("\n") + '</ul>'

# RESOURCES ######################################################################
# Reads source/data/resources.json.
#   {{RESOURCES}}  -> the full list

resourceItems = ->
  data = readJSON "source/data/resources.json"
  items = data?.resources or []
  return '<p class="empty">Resources will appear here.</p>' if items.length is 0
  rows = items.map (r)->
    kind    = if r.kind then '<span class="resource-kind">' + esc(r.kind) + '</span>' else ""
    summary = if r.summary then '<p>' + esc(r.summary) + '</p>' else ""
    byline  = if r.byline then '<p class="resource-byline">' + esc(r.byline) + '</p>' else ""
    ext     = if r.external then ' <span class="resource-ext" aria-hidden="true">&#8599;</span>' else ""
    [
      '<li class="resource-item">'
      kind
      '<div class="resource-detail">'
      '<h3><a href="' + esc(r.url) + '">' + esc(r.title) + '</a>' + ext + '</h3>'
      summary
      byline
      '</div>'
      '</li>'
    ].filter((s)-> s isnt "").join "\n"
  '<ul class="resource-list">' + rows.join("\n") + '</ul>'

# SUPPLIERS ######################################################################
# Reads source/data/suppliers.json — grouped by what they supply.
#   {{SUPPLIERS}}

supplierEntry = (s)->
  title = if s.business and s.name then esc(s.business) + ' <span class="supplier-person">' + esc(s.name) + '</span>'
  else if s.business then esc(s.business)
  else esc(s.name or "")
  loc   = if s.location then '<p class="supplier-location">' + esc(s.location) + '</p>' else ""
  supp  = if s.supplies then '<p>' + s.supplies + '</p>' else ""
  note  = if s.note then '<p class="supplier-note">' + s.note + '</p>' else ""
  links = (s.links or []).map((l)-> '<a href="' + esc(l.url) + '">' + esc(l.label) + '</a>').join("\n")
  linkrow = if links then '<p class="supplier-links">' + links + '</p>' else ""
  [
    '<div class="supplier">'
    '<h4>' + title + '</h4>'
    loc
    supp
    note
    linkrow
    '</div>'
  ].filter((x)-> x isnt "").join "\n"

supplierList = ->
  data = readJSON "source/data/suppliers.json"
  groups = data?.groups or []
  return '<p class="empty">Suppliers will appear here.</p>' if groups.length is 0
  groups.map((g)->
    region = if g.region then ' <span class="supplier-region">' + esc(g.region) + '</span>' else ""
    intro  = if g.intro then '<p class="section-lead">' + g.intro + '</p>' else ""
    [
      '<section class="supplier-group">'
      '<h3>' + esc(g.heading) + region + '</h3>'
      intro
      (g.suppliers or []).map(supplierEntry).join("\n")
      '</section>'
    ].filter((x)-> x isnt "").join "\n"
  ).join "\n"

renderEvents = (html)->
  html = html.replace /\{\{EVENTS_UPCOMING:(\d+)\}\}/g, (m, n)-> upcomingCards parseInt(n, 10)
  html = html.replace /\{\{EVENTS_UPCOMING\}\}/g, -> upcomingCards null
  html = html.replace /\{\{EVENTS_PAST\}\}/g, -> pastCards()
  html = html.replace /\{\{OPPORTUNITIES:(\d+)\}\}/g, (m, n)-> opportunityCards parseInt(n, 10)
  html = html.replace /\{\{OPPORTUNITIES\}\}/g, -> opportunityCards null
  html = html.replace /\{\{NEWSLETTERS:(\d+)\}\}/g, (m, n)-> newsletterItems parseInt(n, 10)
  html = html.replace /\{\{NEWSLETTERS\}\}/g, -> newsletterItems null
  html = html.replace /\{\{RESOURCES\}\}/g, -> resourceItems()
  html = html.replace /\{\{SUPPLIERS\}\}/g, -> supplierList()
  html


task "build", "Compile everything", ()->
  dev = not process.env.NETLIFY

  rm "public"

  template = read "source/pages/_template.html"

  compile "pages", "source/pages/**/[!_]*.html", (path)->
    dest = replace path, "source/pages/": "public/"
    dest = replace dest, ".html": "/index.html" unless dest.endsWith "index.html"
    parsed = pageMeta read(path)
    html = replace template, "PAGE CONTENT GOES HERE": parsed.body
    html = applyMeta html, parsed.meta, dest
    write dest, renderEvents html

  compile "scripts", ()->
    write "public/scripts.js", concat readAll "source/scripts/**/*.js"

  compile "styles", ()->
    write "public/styles.css", concat readAll "source/styles/**/*.css"

  compile "global assets", "source/assets/**/*.*", (path)->
    copy path, replace path, "source/":"public/"

  compile "data", "source/data/**/*.*", (path)->
    copy path, replace path, "source/":"public/"

  compile "page assets", "source/pages/**/*.!(html)", (path)->
    copy path, replace path, "source/pages/":"public/"


# FONTS CONFIG ####################################################################################

# This URL will be used to generate CSS @font-face rules
baseUrl = "/assets/fonts"

# These paths will be scanned for chars we want to include in font subsets.
pathsToScanForChars = [
  "source/pages/**/*.html"
]

# Add any extra chars to be included
extraChars = ""

# These weights will be used to generate CSS font-weight rules. We exclude "regular" because it's the default.
weights = hairline: 100, thin: 200, light: 300, medium: 500, semibold: 600, bold: 700, extrabold: 800, heavy: 800, black: 900

# These variants will be used to generate CSS font-style rules. We exclude "normal" because it's the default.
variants = { "italic" }

# Slug me
sluggify = (string)->
  string.toLowerCase()
        .replaceAll "'", "" # Remove apostrophes
        .replaceAll /[^a-z0-9\/]+/g, '-' # Replace all runs of non-alphanumeric chars with a single dash
        .replaceAll /-+\//g, "/" # Strip dashes before a slash
        .replaceAll /\/-+/g, "/" # Strip dashes after a slash
        .replace /^-+/, "" # Strip leading dashes
        .replace /-+$/, "" # Strip trailing dashes


# COUNT CHARS ####################################################################################

task "chars", "Scan a bunch of locations to figure out which chars we'll use for subsetting", ()->
  chars = {}

  for file in glob pathsToScanForChars
    for char in Array.from read file
      chars[char] ?= 0
      chars[char]++

  for char in Array.from extraChars
    chars[char] ?= 0
    chars[char]++

  text = Object.keys chars
               .sort()
               .join("")
               .toWellFormed()

  write "Chars.txt", text

  console.log "Updated the Chars.txt file with the following\n" + text

# SUBSET FONTS ####################################################################################

task "fonts", "Create optimized subsets of all fonts in the source folder", ()->

  return console.log "You need to run `cake chars` first" unless exists "Chars.txt"

  rm "source/assets/fonts"

  fontFaceRules = []
  fontClasses = []

  # For each typeface folder in the source folder
  for typefacePath in glob "fonts/*"
    [_, typeface] = typefacePath.split "/"

    mkdir "source/assets/fonts/" + sluggify typeface

    # For each file in this typeface folder
    for filePath in glob "fonts/#{typeface}/*"
      [_, _, file] = filePath.split "/"

      ext = path.extname file
      filename = file.replace ext, ""
      sourcePath = "fonts/#{typeface}/#{file}"
      outputPath = "source/assets/fonts/" + sluggify("#{typeface}/#{filename}") + ext

      # Non-font files, like a Readme or License, just need to be copied straight across and then we're done
      unless [".otf", ".ttf", ".woff", ".woff2"].includes ext
        copy sourcePath, outputPath
        continue

      # Generate a subset font
      execSync "hb-subset \"#{sourcePath}\" --text-file=Chars.txt --layout-features=kern -o #{outputPath}"

      # Convert the subset font to woff2
      unless ext is ".woff2"
        execSync "woff2_compress #{outputPath}"
        rm outputPath

      # We'll use this src in our @font-face rule(s)
      src = '  src: url("' + "#{baseUrl}/#{sluggify typeface}/#{sluggify filename}.woff2" + '") format("woff2");\n'

      # Generate a @font-face rule
      fontFaceRules.push fontFaceRule typeface, filename, src

  # Write out the CSS file
  write "source/assets/fonts.css", [fontFaceRules, fontClasses].flat().join "\n"

fontFaceRule = (typeface, fontname, src)->
  "@font-face {\n  font-display: block;\n" + fontCSS(typeface, fontname) + ";\n" + src + "}"

fontCSS = (typeface, fontname)->
  css = []
  css.push "  font-family:\"#{typeface}\""
  for part in sluggify(fontname).split "-"
    css.push "  font-weight:#{weights[part]}" if weights[part]?
    css.push "  font-style:#{variants[part]}" if variants[part]?
  css.join ";\n"

fontClassName = (typeface, fontname)->
  css = [typeface]
  for part in sluggify(fontname).split "-"
    css.push part if weights[part]? or variants[part]?
  sluggify css.join "-"


# TASKS ###########################################################################################

task "watch", "Recompile on changes.", ()->
  watch "source", "build", reload

task "serve", "Spin up a live reloading server.", ()->
  serve "public"

task "start", "Build, watch, and serve.", ()->
  invoke "chars"
  invoke "fonts"
  invoke "build"
  invoke "watch"
  invoke "serve"
