# Space Paw

A browser-based reflex game where you click a bouncing paw as it flies across a starfield. Each hit scores points and makes the paw faster — how long can you keep up?

## How to Play

1. Open `index.html` in any modern browser
2. Click anywhere on the canvas to start
3. Click the bouncing paw to score points
4. The paw speeds up with every hit

## Controls

| Action | Input |
|--------|-------|
| Start game | Click the canvas |
| Score points | Click the paw |

## Tech Stack

- HTML5 Canvas
- Vanilla JavaScript
- CSS3

## Project Structure

```
├── index.html   # Entry point
├── game.js      # Game loop, rendering, and input handling
└── style.css    # Layout and styling
```

## Running Locally

No build step required. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
npx serve .
```

## License

MIT
