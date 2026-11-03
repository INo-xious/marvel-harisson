# Marvel Harisson · A little room

An interactive watercolor portfolio with live Osaka daylight, painted room objects, and a laptop that opens into a layered landscape desktop. The current design is served at `/` and `/brush-study.html`.

## Content

The laptop contains Timeline, Résumé, Projects and Notes folders. Projects has two collections:

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
