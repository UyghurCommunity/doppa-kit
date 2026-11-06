# دوپپا · Doppa Kit

Interactive doppa-inspired embroidery for websites, plus deterministic SVG textile patterns. Framework-independent, no runtime dependencies, no import-time DOM access. Original digital interpretations; not historical reproductions.

[Live playground](https://uyghurcommunity.github.io/doppa-kit/) · [UyghurCommunity](https://github.com/UyghurCommunity)

## ئۇيغۇرچە

تور بېتىڭىزگە ھەرىكەتچان دوپپا نەقىشى قوشۇڭ. سۆرەپ ئايلاندۇرۇش، ئۈچ رەڭ ئۇسلۇبى، ۋاقىتلىق توختىتىش ۋە SVG ھۆججىتى چىقىرىشنى قوللايدۇ. سىستېمىنىڭ ھەرىكەتنى ئازايتىش تەڭشىكىگە ئەمەل قىلىدۇ.

## Try the source

This repository contains the complete npm package source. Registry publication is a separate release step; use a local package until a version is published:

```bash
# From this repository
npm pack
# From your application directory
npm install /path/to/doppa-kit/uyghurcommunity-doppa-0.1.0.tgz
```

Once published, the package name is `@uyghurcommunity/doppa`.

```html
<canvas id="doppa" style="width:100%;height:420px"></canvas>
<script type="module">
  import { createDoppa } from './src/index.js';
  const artwork = createDoppa(document.querySelector('#doppa'));
  artwork.setPalette('atlas');
  // On unmount: artwork.destroy();
</script>
```

Give the canvas explicit CSS width and height so retina backing dimensions do not change the layout. The canvas is keyboard-focusable: arrows rotate/tilt, Space pauses, Home resets. `destroy()` releases pointer capture, animation frames, event listeners and observers, restores attributes, and permits remounting.

## API

`createDoppa(canvas, options)` returns an independent instance. Options: `palette` (`badam`, `atlas`, `golden`), `paused`, `autoRotate`, `colors`, and `onChange(state)`.

- `setPalette(name)`, `setColors({ cloth, thread, detail, trim })` — custom colors use `#RRGGBB`.
- `pause()`, `resume()`, `reset()`, `rotate(horizontalRadians, verticalRadians)`, `resize()`.
- `getState()` — palette, rotation, pause, reduced motion and lifecycle status.
- `toSVG()` — current sculpture as standalone vector artwork, without a background.
- `destroy()` — idempotent cleanup. Mutating a destroyed instance throws.

SVG pattern generation works in Node and the browser:

```js
import { createPattern } from './src/index.js';
const svg = createPattern({ type: 'atlas', width: 512, height: 512, seed: 12,
  colors: { thread: '#59cac3', detail: '#e878a0' } });
```

Pattern types: `almond`, `atlas`, `rosette`. Same options produce identical SVG. Width/height are bounded to 2048 and tile size to 24–512. Colors are validated before SVG interpolation. A custom cloth color tints the sculpture's atlas stripes while preserving their variation. `onChange` reports control and pointer changes, not every animation frame.

See [the React example](examples/Doppa.jsx) for an existing React application. React is not a dependency of this package.

## Development

```bash
npm test
python3 -m http.server 4174
```

Open `http://localhost:4174/`. Serve through HTTP; browser ES modules cannot reliably load from `file://`.

## License and design

Code and original digital artwork: MIT, UyghurCommunity. No font binaries, dictionary content or upstream swarm engine are bundled. Cultural inspiration: doppa embroidery and atlas textile colors; specific motifs here are newly drawn artistic interpretations. Native-speaker and craft-community feedback is welcome through GitHub issues.

## Playground typography

Uyghur interface and control text use the externally linked **ALKATIP Basma** font, with WOFF2, WOFF, and TTF fallbacks and `font-display: swap`. Explicit language spans and system/monospace stacks preserve the existing Latin and code typography. The `.alkatip-basma` helper sets RTL direction, bidi embedding, and line-height 2.2. Font binaries are not bundled, and the renderer generates geometry rather than drawing font-dependent text.
