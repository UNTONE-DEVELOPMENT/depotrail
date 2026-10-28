import path from "path";

const TYPES = {
    ".ogg": "audio/ogg",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".js": "text/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".txt": "text/plain",
    ".md": "text/markdown",
};

export default class Mime {
    static For(file) {
        return TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    }
}
