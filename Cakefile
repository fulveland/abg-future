path = require "path"
require "sweetbread"

task "build", "Compile everything", ()->
  dev = not process.env.NETLIFY

  rm "public"

  template = read "source/pages/_template.html"

  compile "pages", "source/pages/**/[!_]*.html", (path)->
    dest = replace path, "source/pages/": "public/"
    dest = replace dest, ".html": "/index.html" unless dest.endsWith "index.html"
    write dest, replace template, "PAGE CONTENT GOES HERE": read(path)

  compile "scripts", ()->
    write "public/scripts.js", concat readAll "source/scripts/**/*.js"

  compile "styles", ()->
    write "public/styles.css", concat readAll "source/styles/**/*.css"

  compile "global assets", "source/assets/**/*.*", (path)->
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
weights = hairline: 100, thin: 200, light: 300, medium: 500, semibold: 600, bold: 700, heavy: 800, black: 900

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
