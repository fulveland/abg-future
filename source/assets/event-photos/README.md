# event-photos

Formatted workshop photos for the website's event cards.

- One image per event, named after the event's `id` (e.g. `edmonton-cattail-berry-basket-2026-09-05.jpg`).
  That filename is what the event's `image` field in `data/events.json` (or `past-events.json`) points to.
- Photos originate from the shared events Google Doc — teachers paste a photo under their event.
  The daily sync extracts each one, formats it (JPG, max 1600px wide, ~82% quality, metadata
  stripped, orientation corrected), and saves it here.
- When a photo is replaced or its event is removed, the old file is moved to `docs/delete/`
  rather than deleted in place.

Served at `/assets/event-photos/<id>.jpg` after a build.
