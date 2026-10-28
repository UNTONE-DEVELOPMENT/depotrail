import fs from "node:fs";
import path from "node:path";
import Command from "./Command.js";
import Config from "../Config.js";
import Scanner from "../Files/Scanner.js";
import Hasher from "../Files/Hasher.js";
import Depot from "../Api/Depot.js";
import Upload from "../Api/Upload.js";
import Format from "../Utils/Format.js";
import Mime from "../Utils/Mime.js";
import Pool from "../Utils/Pool.js";

export default class Publish extends Command {
    commandName = "publish";
    helpMessage = "hashes and uploads a build as a new draft version (set DEPOT_KEY or put it in .env, release it in the dashboard after)";
    usage = "depotrail publish <version> [--config depot.json] [--branch name] [--concurrency 4] [--dry-run]";

    async Run(args, flags) {
        let version = args[0];
        if (!version) {
            throw new Error(`Missing version. Usage: ${this.usage}`);
        }

        let config = Config.Load(flags.config ?? "depot.json");
        if (flags.branch) {
            config.branch = flags.branch;
        }

        let dryRun = flags["dry-run"] === true;
        // picks up DEPOT_KEY from a .env next to the config, real env vars win
        let envFile = path.join(config.dir, ".env");
        if (fs.existsSync(envFile)) {
            process.loadEnvFile(envFile);
        }

        let key = process.env.DEPOT_KEY;
        if (!dryRun && !key) {
            throw new Error("DEPOT_KEY is not set");
        }

        let concurrency = parseInt(flags.concurrency ?? "4");
        if (!concurrency || concurrency < 1) {
            concurrency = 4;
        }

        let files = await this.Collect(config);
        let totalSize = files.reduce((sum, file) => sum + file.size, 0);
        let unique = new Map();
        for (let file of files) {
            unique.set(file.hash, file);
        }

        console.log(`${config.app}/${config.branch} ${version}: ${files.length} files, ${Format.Bytes(totalSize)}, ${unique.size} unique blobs`);

        if (dryRun) {
            for (let file of files) {
                console.log(`  [${file.platform}] ${file.path} ${file.hash.slice(0, 12)} ${Format.Bytes(file.size)}`);
            }
            console.log("\nDry run, nothing was sent");
            return;
        }

        let depot = new Depot(config.server, key);
        let manifest = files.map((file) => {
            return {
                path: file.path,
                hash: file.hash,
                size: file.size,
                mime: Mime.For(file.path),
                platform: file.platform
            };
        });

        let started = await depot.Start(config.app, config.branch, version, manifest);
        let uploads = started.upload ?? [];
        console.log(`Draft created, uploading ${uploads.length} new blobs`);

        await this.Upload(uploads, unique, concurrency);

        let finished = await depot.Finish(config.app, config.branch, started.version_id);
        if (!finished.complete) {
            throw new Error(`Server is still missing ${finished.missing?.length ?? "some"} blobs, run publish again`);
        }

        console.log(`Version ${version} is ready. Release it at ${config.server}/partner/depot`);
    }

    // scans every platform folder, hashes, then tags shared files as "all"
    async Collect(config) {
        let hasher = new Hasher(path.join(config.dir, ".depotrail-cache.json"));
        let byPlatform = {};
        let everything = [];

        for (let platform of Object.keys(config.platforms)) {
            let found = Scanner.Scan(config.platforms[platform], config.ignore);
            byPlatform[platform] = found;
            everything.push(...found);
        }

        let done = 0;
        await Pool.Run(everything, 8, async (file) => {
            file.hash = await hasher.Hash(file);
            done++;
            Format.Status(`Hashing ${done}/${everything.length}`);
        });
        Format.EndStatus();

        hasher.Prune(everything);
        hasher.Save();

        let platforms = Object.keys(config.platforms);
        let result = [];

        // with a single platform there's nothing to share, so keep its tag
        if (platforms.length < 2) {
            for (let file of byPlatform[platforms[0]]) {
                file.platform = platforms[0];
                result.push(file);
            }
            return result;
        }

        let maps = {};
        for (let platform of platforms) {
            maps[platform] = new Map(byPlatform[platform].map((file) => [file.path, file]));
        }

        let seen = new Set();
        for (let platform of platforms) {
            for (let file of byPlatform[platform]) {
                let shared = platforms.every((other) => {
                    let match = maps[other].get(file.path);
                    return match && match.hash === file.hash;
                });

                if (!shared) {
                    file.platform = platform;
                    result.push(file);
                    continue;
                }

                if (seen.has(file.path)) {
                    continue;
                }
                seen.add(file.path);
                file.platform = "all";
                result.push(file);
            }
        }

        result.sort((a, b) => (a.path < b.path ? -1 : 1));
        return result;
    }

    async Upload(uploads, unique, concurrency) {
        let total = uploads.reduce((sum, item) => sum + unique.get(item.hash).size, 0);
        let sent = 0;
        let done = 0;

        await Pool.Run(uploads, concurrency, async (item) => {
            let file = unique.get(item.hash);
            if (!file) {
                throw new Error(`Server asked for unknown blob ${item.hash}`);
            }

            await Upload.Put(item.url, file, item.mime, (bytes) => {
                sent += bytes;
                Format.Status(`Uploading ${done}/${uploads.length} files, ${Format.Bytes(Math.min(sent, total))} / ${Format.Bytes(total)}`);
            });
            done++;
        });
        Format.EndStatus();
    }
}
