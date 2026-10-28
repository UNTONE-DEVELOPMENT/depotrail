import fs from "node:fs";
import path from "node:path";

export default class Config {
    server = "";
    app = "";
    branch = "";
    platforms = {};
    ignore = [];
    dir = "";

    static Load(file) {
        let full = path.resolve(file);
        if (!fs.existsSync(full)) {
            throw new Error(`Config file not found: ${full}`);
        }

        let data;
        try {
            data = JSON.parse(fs.readFileSync(full, "utf8"));
        } catch (err) {
            throw new Error(`Config file is not valid JSON: ${err.message}`);
        }

        let config = new Config();
        config.dir = path.dirname(full);
        config.server = String(data.server ?? "").replace(/\/+$/, "");
        config.app = String(data.app ?? "");
        config.branch = String(data.branch ?? "");
        config.ignore = data.ignore ?? [];

        // directories are relative to the config file
        let platforms = data.platforms ?? {};
        for (let platform of Object.keys(platforms)) {
            config.platforms[platform] = path.resolve(config.dir, platforms[platform]);
        }

        config.Validate();
        return config;
    }

    Validate() {
        if (!this.server) {
            throw new Error(`Config is missing "server"`);
        }
        if (!this.app) {
            throw new Error(`Config is missing "app"`);
        }
        if (!this.branch) {
            throw new Error(`Config is missing "branch" (or pass --branch)`);
        }
        if (Object.keys(this.platforms).length === 0) {
            throw new Error(`Config needs at least one entry in "platforms"`);
        }

        for (let platform of Object.keys(this.platforms)) {
            let dir = this.platforms[platform];
            if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
                throw new Error(`Directory for "${platform}" not found: ${dir}`);
            }
        }
    }
}
