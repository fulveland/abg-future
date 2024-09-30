require "sweetbread"

task "build", "Compile everything", ()->
  dev = not process.env.NETLIFY

  # Folders
  rm "public"

  # Pages
  template = read "source/pages/_template.html"

  compile "pages", "source/pages/**/[!_]*.html", (path)->
    dest = path.replace "source/pages", "public"
    dest = dest.replace(".html", "/index.html") unless dest.endsWith "index.html"
    write dest, replace template, "PAGE CONTENT GOES HERE": read(path)

  # Scripts
  compile "scripts", ()->
    write "public/scripts.js", concat readAll "source/scripts/**/*.js"

  # Styles
  compile "styles", ()->
    write "public/styles.css", concat readAll "source/styles/**/*.css"


# TASKS ###########################################################################################

task "watch", "Recompile on changes.", ()->
  watch "source", "build", reload

task "serve", "Spin up a live reloading server.", ()->
  serve "public"

task "start", "Build, watch, and serve.", ()->
  invoke "build"
  invoke "watch"
  invoke "serve"
