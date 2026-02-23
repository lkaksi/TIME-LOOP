// preload.js
const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

const runtimeRoots = [
  process.cwd(),
  __dirname,
  process.resourcesPath,
  path.dirname(process.execPath),
  path.join(process.resourcesPath || '', 'app.asar'),
  path.join(process.resourcesPath || '', 'app')
].filter(Boolean);

function readFileBytes(filePath) {
  if (!filePath) return null;

  const normalized = String(filePath).replace(/^[.][\\/]/, '');
  const candidates = [filePath, normalized, ...runtimeRoots.map(root => path.join(root, normalized))];

  const resolved = candidates.find(p => fs.existsSync(p));
  if (!resolved) return null;

  const buffer = fs.readFileSync(resolved);
  return Uint8Array.from(buffer);
}

contextBridge.exposeInMainWorld("songAPI", {
  loadSongsFromFolder: () => {
    const songsDir = path.join(process.cwd(), "songs");

    if (!fs.existsSync(songsDir)) return [];

    return fs.readdirSync(songsDir)
      .filter(f => f.toLowerCase().endsWith(".mp3"))
      .map(file => ({
        name: file.replace(/\.[^/.]+$/, ""),
        path: path.join(songsDir, file)
      }));
  },

  readSongFileAsArrayBuffer: (filePath) => readFileBytes(filePath),
  readBundledSongAsArrayBuffer: (relativePath) => readFileBytes(relativePath)
});
