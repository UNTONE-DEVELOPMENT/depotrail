import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

export default class Hasher {
    cache = {};
    cacheFile = "";
    dirty = false;

    constructor(cacheFile) {
        this.cacheFile = cacheFile;

        try {
            this.cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
        } catch (err) {
            this.cache = {};
        }
    }

    // skips reading the file if size and mtime haven't changed since last time
    async Hash(file) {
        let key = `${file.full}|${file.size}|${file.mtimeMs}`;
        if (this.cache[key]) {
            return this.cache[key];
        }

        let hash = await Hasher.HashFile(file.full);
        this.cache[key] = hash;
        this.dirty = true;
        return hash;
    }

    static HashFile(full) {
        return new Promise((resolve, reject) => {
            let hash = crypto.createHash("sha256");
            let stream = fs.createReadStream(full);
            stream.on("error", reject);
            stream.on("data", (chunk) => hash.update(chunk));
            stream.on("end", () => resolve(hash.digest("hex")));
        });
    }

    Save() {
        if (!this.dirty) {
            return;
        }

        // only keep entries for files we saw this run, so the cache can't grow forever
        fs.mkdirSync(path.dirname(this.cacheFile), {recursive: true});
        fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache));
    }

    Prune(files) {
        let keep = {};
        for (let file of files) {
            let key = `${file.full}|${file.size}|${file.mtimeMs}`;
            keep[key] = this.cache[key];
        }
        this.cache = keep;
        this.dirty = true;
    }
}
