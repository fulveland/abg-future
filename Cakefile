fs = require "fs"
glob = require "glob"
require "sweetbread"

# Borrowing these from Sweetbread
autoprefixer = require "autoprefixer"
postcss = require "postcss"


overrideBrowserslist = "last 2 Chrome versions, last 2 ff versions, last 2 Safari versions, last 2 iOS versions"
plugins = [autoprefixer {overrideBrowserslist}]


readFile = (filePath)-> fs.readFileSync(filePath).toString()
writeFile = (filePath, content)-> fs.writeFileSync filePath, content


task "build", "Compile everything", ()->
  dev = not process.env.NETLIFY

  # Folders
  rm "public"

  # Pages
  template = readFile "source/pages/_template.html"
  for p in glob.sync "source/pages/**/[!_]*.html"
    content = readFile p
    dest = p.replace("source/pages","public")
    dest = dest.replace(".html", "/index.html") unless dest.endsWith "index.html"

    mkdir dest.replace "/index.html", ""

    content = template.replace "PAGE CONTENT GOES HERE", content
    writeFile dest, content

  # Scripts
  scripts = glob.sync "source/scripts/**/*.js"
                .map readFile
                .join "\n\n"
  writeFile "public/scripts.js", scripts

  # Styles
  styles = glob.sync "source/styles/**/*.css"
               .map readFile
               .join "\n\n"
  processed = postcss(plugins).process styles
  processed.warnings().forEach (w)-> log red w.toString()
  writeFile "public/styles.css", processed.css


# TASKS ###########################################################################################

task "watch", "Recompile on changes.", ()->
  watch "source", "build", reload

task "serve", "Spin up a live reloading server.", ()->
  serve "public"

task "start", "Build, watch, and serve.", ()->
  doInvoke "build"
  doInvoke "watch"
  doInvoke "serve"
