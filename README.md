# DRIFT

DRIFT is a small static HTML/JavaScript point-and-click canvas game. It has no build step and runs directly from the repository files through a static web server.

The game supports desktop and mobile browsers. The canvas scales to fit the viewport while preserving its original aspect ratio, and pointer/touch input is mapped back to the internal game coordinates.

## Run Locally

From the repository root:

```sh
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

On Windows, use `py -m http.server 8080` or `python -m http.server 8080` if `python3` is not available.

You can also use:

```sh
npm run serve
```

This script only starts a static file server and does not install dependencies.

## Fullscreen and Mobile

Use the fullscreen button in the top-right corner of the game stage to enter or exit fullscreen. Browsers with the standard Fullscreen API use native fullscreen. Browsers without that support, including some iOS Safari versions, fall back to a CSS pseudo-fullscreen mode that expands the stage to the available viewport.

Mobile portrait mode is supported, but landscape is more comfortable because the game uses a wide canvas.

## Deploy to Cloudflare Pages

1. Push this repository to GitHub.
2. In Cloudflare Pages, create a new project and connect the GitHub repo.
3. Use framework preset: `None` / `Static HTML`.
4. Leave the build command empty.
5. Set the build output directory to `/` or the repository root.
6. Deploy.
7. Optional: add a custom domain through Cloudflare DNS.

Cloudflare Pages root hosting remains the recommended deployment path because the game is a plain static site and `index.html` is already at the repository root.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Open repository `Settings` -> `Pages`.
3. Set source to `Deploy from a branch`.
4. Select branch: `main`.
5. Select folder: `/root`.
6. Save.

The project uses relative asset paths, so it should also work from a GitHub Pages project subpath such as `https://user.github.io/repo-name/`.

## Main Files

- `index.html`: root entry point for the game.
- `js/core.js`: canvas setup, shared state, save data, input helpers, and generated Web Audio.
- `js/paint.js`: drawing helpers and reusable visual primitives.
- `js/scenes_a.js`: first group of game scenes.
- `js/scenes_b.js`: second group of game scenes.
- `js/meta.js`: title, intro, credits, and logo image loading.
- `js/star.js`: secret star ride mode.
- `js/main.js`: transitions, input handling, inventory refresh, and main animation loop.
- `logo-kreitech.png`, `logo-nullmonkey.png`: credits logos loaded by the game.
- `samorost_point_click_game.html`: earlier standalone generated version kept as source/reference material.

## Static Hosting Notes

The active game entry point is `index.html` in the repository root. JavaScript files are loaded from `js/` using relative paths, and the image assets used at runtime are loaded from the repository root using relative paths. Audio is generated with the Web Audio API, so there are no audio files to deploy.
