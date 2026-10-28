import fs from "node:fs";
import path from "node:path";

export default class Scanner {
    // converts a small glob (**, *, ?) into a regex
    static GlobToRegex(glob) {
        let source = "";
        for (let i = 0; i < glob.length; i++) {
            let char = glob[i];

            if (char === "*" && glob[i + 1] === "*") {
                source += ".*";
                i++;
                if (glob[i + 1] === "/") {
                    i++;
                }
                continue;
            }
            if (char === "*") {
                source += "[^/]*";
                continue;
            }
            if (char === "?") {
                source += "[^/]";
                continue;
            }
            source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        }
        return new RegExp(`^${source}$`);
    }

    static BuildIgnore(patterns) {
        let matchers = patterns.map((pattern) => {
            return {
                regex: Scanner.GlobToRegex(pattern),
                basenameOnly: !pattern.includes("/")
            };
        });

        return (relative) => {
            let base = relative.split("/").pop();
            for (let matcher of matchers) {
                if (matcher.regex.test(relative)) {
                    return true;
                }
                if (matcher.basenameOnly && matcher.regex.test(base)) {
                    return true;
                }
            }
            return false;
        };
    }

    // returns [{path, full, size, mtimeMs}] sorted by path
    static Scan(root, ignore) {
        let isIgnored = Scanner.BuildIgnore(ignore);
        let files = [];

        let walk = (dir) => {
            for (let entry of fs.readdirSync(dir, {withFileTypes: true})) {
                let full = path.join(dir, entry.name);
                let relative = path.relative(root, full).split(path.sep).join("/");

                if (isIgnored(relative)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    walk(full);
                    continue;
                }
                if (!entry.isFile()) {
                    continue;
                }

                let stat = fs.statSync(full);
                files.push({path: relative, full, size: stat.size, mtimeMs: stat.mtimeMs});
            }
        };

        walk(root);
        files.sort((a, b) => (a.path < b.path ? -1 : 1));
        return files;
    }
}
