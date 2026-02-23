// preload.js
const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

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
  }
});
