// preload.js
const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

function readFileBytes(filePath) {
  if (!filePath) return null;

  const candidates = [
    filePath,
    path.join(process.cwd(), filePath),
    path.join(__dirname, filePath)
  ];

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
