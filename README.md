## Lipgloss
A bit of lipgloss to make your website shine.

### Features
- Progressively enhance server rendered pages with transitions
- Easily define multiple views per page
- You can nest views!
- Only ~5KB (minified & gzipped)

### Using lipgloss
Define views in your html using `[data-view="view-name"]`.

### Cross browser usage
To use this module, your target browser needs to support `history.pushState`, `history.replaceState` and the `popstate` event. The following may need to be polyfilled, depending on your target browsers:
- `fetch`
- `Request`
- `Promise`
- `Object.assign`
- `Array.from`
- `Array.some`
- `Array.includes`
- `CustomEvent`

You will also need to include the regenerator runtime when transpiling `async` `await` away with Babel.
Install: `npm i regenerator-runtime --save`
Use: `import regenerator-runtime/runtime`