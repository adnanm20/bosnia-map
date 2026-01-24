const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8000;

// Absolute path to your static files directory
const BASE_DIR = path.resolve("./");

// Whitelist: URL path → file on disk
const FILES = {
  "/": "index.html",
  "/index.html": "index.html",
  "/css/style.css": "css/style.css",
  "/js/map.js": "js/map.js",
  "/js/constants.js": "js/constants.js",
  "/js/utils.js": "js/utils.js",
	"/data/bh_country.geojson": "data/bh_country.geojson",
	"/data/bh_entities.geojson": "data/bh_entities.geojson",
	"/data/bh_cantons.geojson": "data/bh_cantons.geojson",
	"/data/bh_municipalities.geojson": "data/bh_municipalities.geojson",
	"/data/bh_roads_filtered_noresid.geojson": "data/bh_roads_filtered_noresid.geojson",
};

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".geojson": "text/json",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

http.createServer((req, res) => {
  const fileName = FILES[req.url.split('?')[0]];

  if (!fileName) {
    res.writeHead(404);
    return res.end("Not found");
  }

  const filePath = path.join(BASE_DIR, fileName);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end("Server error");
    }

    const ext = path.extname(fileName);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    });

    res.end(data);
  });
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Static server running on http://127.0.0.1:${PORT}`);
});

