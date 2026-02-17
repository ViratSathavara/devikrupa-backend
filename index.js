// Root entrypoint for hosts (like Render) that run `node index.js` by default.
// For local/dev use `npm run dev` or `npm start`.

try {
  require('./dist/index.js');
} catch (err) {
  console.error('Failed to load ./dist/index.js — have you run `npm run build`?');
  console.error(err);
  process.exit(1);
}
