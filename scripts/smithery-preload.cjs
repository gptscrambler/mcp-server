/**
 * Smithery CLI uploads require global `File` (Node 20+).
 * Polyfill for Node 18 using node:buffer.File.
 */
const { File } = require("node:buffer");
globalThis.File = File;
