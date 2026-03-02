"use strict";

try {
  require("./dist/index.js");
} catch (error) {
  console.error(
    "Failed to start backend from dist/index.js. Run `npm run build` before starting."
  );
  throw error;
}
