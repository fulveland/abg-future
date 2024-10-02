# Alberta Basketry Guild Future Website

### Dependencies
CoffeeScript, Node, and the following brews:

```
brew install harfbuzz woff2
```

### Building

Run `cake start` to work on the project locally on your computer.

### Folder structure

* `public/` — Destroyed and rebuilt on every change, so don't put anything in here.
* `source/`
  * `pages/` — Any HTML files in here are wrapped with `_template.html`, then copied to `public`.
  * `scripts/` — Any scripts in here are concatenated and compiled to `public/scripts.js`.
  * `styles/` — Any stylesheets in here are concatenated and compiled to `public/styles.css`.

### Notes

When linking to a page, don't include the `.html`
* Good: `<a href="/about">`
* Bad: `<a href="/about.html">`
