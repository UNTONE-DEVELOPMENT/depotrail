# depotrail

Publishes builds to an UNTONE depot.

```
DEPOT_KEY=... npx depotrail publish 1.2.0
```

The version is uploaded as a draft, release it from the partner dashboard afterwards.

## depot.json

```json
{
    "server": "https://untone.org",
    "app": "cubey",
    "branch": "release",
    "platforms": {
        "win-x64": "release/cubey26-win32-x64",
        "linux-x64": "release/cubey26-linux-x64"
    },
    "ignore": ["quick.sh", "**/*.map"]
}
```

Folders are relative to the config file. Files that are identical in every platform folder are published as `all`, the rest keep their platform. With a single platform, everything is tagged with it.

Patterns without a slash match any file name, `*` and `?` stay inside a folder and `**` crosses folders.

## Flags

- `--config <file>` config path, defaults to `depot.json`
- `--branch <name>` overrides the branch from the config
- `--concurrency <n>` parallel uploads, defaults to 4
- `--dry-run` hashes and lists files without contacting the server (no key needed)

Hashes are cached in `.depotrail-cache.json` next to the config.
