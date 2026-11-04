# Marvel Harisson · A little room

An interactive watercolor portfolio with live Osaka daylight, painted room objects, and a laptop that opens into a macOS-style desktop. The current design is served at `/` and `/brush-study.html`.

## Content

The room objects are the controls: click the lamp to toggle its warm desk light, click the radio to open a Spotify-style music player, drag the painted clock hands to choose the time of day, and click a social icon for a captured website preview. Outside clicks or Escape dismiss previews. The radio plays the three bundled tracks with play/pause, previous/next, seeking and volume; closing the popup leaves music playing. The room caption offers Open the laptop and a direct View Projects link. The clock and daylight follow live Osaka time until a preview time is selected. Drag either hand directly on the painted face. Double-click the clock (or press Home while it has focus) to return to live time; arrow keys provide keyboard adjustment.

The laptop opens a full-screen Mac desktop with a menu bar, Dock and draggable Finder windows over the room’s painted laptop glass. The red/yellow/green window controls close, minimize and expand windows. Double-click desktop folders, or click Dock and sidebar icons, to open Projects, Timeline, Résumé and Notes. Finder search filters the current collection. Projects has two collections:

- **Projects:** nine entries, including Stockbit MCP, Marvelous Engine, the IDX ownership pipeline, deterministic agent regression testing, robotics, Pacman AI, coursework, this portfolio and the GitHub profile.
- **Contributions:** 31 authored pull requests across 15 external repositories, each linked directly and labeled Merged, Open or Closed. Status is a snapshot verified on **3 November 2026**; follow the pull request for the current state.

Experience, education, organization history and awards combine the supplied résumé with the [public LinkedIn profile](https://www.linkedin.com/in/marvel-harisson/). GitHub evidence is in `data/github-contributions.json`. Forks are not presented as original projects. Internship work without a public repository has no invented source link. The original supplied résumé PDF is retained unchanged.

Edit `public/content.js` to update the room content. Artwork, music and the browser runtime are local in `public/assets` and `public/vendor`; no service credentials or backend are needed for the painting.

## Development

Use Node.js 24+ and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3000>. Next.js serves the static painting at the root through a `beforeFiles` rewrite. The earlier Next.js routes remain accessible at `/projects`, `/timeline`, `/about`, `/lab` and `/contact`.

To preview only the painting without Node dependencies:

```sh
python3 -m http.server 8860 --bind 127.0.0.1 --directory public
```

Then open <http://localhost:8860/brush-study.html>. Serve `public` as the web root because artwork and module paths are root-relative.

## Checks

```sh
pnpm check:room
pnpm typecheck
pnpm test
pnpm build
```

The room validators cover geometry, local assets, live time, camera registration, layer depth, transition lifecycle, reduced motion and content links. The retained legacy browser suite targets the previous homepage and is not a validation of the new room.

For visual review, test laptop entry/return, Projects → Contributions, project previews, keyboard navigation, résumé/profile links, day/night controls and narrow screens. Keep the expressive watercolor artwork, surrounding paper, perspective, animated water and plants, and reduced-motion behavior.

## Deployment

The repository retains its Next.js build contract (`pnpm build`, `pnpm start`) for the existing host. The painting is included in `public`; no separate asset download or build step is required. The main URL remains [marvelharisson.com](https://marvelharisson.com/).

## Rendering and delivery

The active room uses compressed WebP paintings (about 2.5 MB of delivery textures, down from about 16 MB of PNG sources). Original artwork remains in the repository. The desktop controls fade in over the painted glass as it fills the viewport.

The room limits its render target to 1.4 million pixels, disables offscreen multisampling, caps device pixel ratio at 1 on phones and 1.25 on desktop, and renders the resting room at 30 fps. Laptop camera transitions retain a 60 fps budget. Rendering pauses in hidden tabs and behind a settled laptop desktop, with a fresh frame after a resize. The retired watercolor desktop modules and artwork remain available as source history, with their validators. Audio is loaded only on playback.

For a local night-light review, open `/brush-study.html?previewTime=1260`; the normal homepage always uses live time.

Website preview images in `public/assets/previews` were captured from the actual public destinations on 3 November 2026 and load only when opened. LinkedIn currently returns a sign-in wall for logged-out visitors, so its captured preview includes that state. Gmail uses its public product page as the visual preview; clicking opens an email to Marvel. These are clickable snapshots, not live embedded pages. The room uses tighter default framing (about 20% larger) while retaining its rendering budget.

The laptop begins asleep with the original painted glass, blue-grey pigment and diagonal reflection visible. Opening the laptop moves the camera into that same glass and fades in the desktop controls. Entry and return each take about 2.6 seconds. The controls fade out on return while the camera pulls back into the room. Reduced motion opens and closes immediately. Escape can reverse entry safely. `public/laptop-transition.js` provides the shared camera and desktop fade timing.
