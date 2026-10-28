export default class Depot {
    server = "";
    key = "";

    constructor(server, key) {
        this.server = server;
        this.key = key;
    }

    async Post(route, body) {
        let response = await fetch(`${this.server}/api/depot/${route}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Depot-Key": this.key
            },
            body: JSON.stringify(body)
        });

        let json;
        try {
            json = await response.json();
        } catch (err) {
            throw new Error(`Server returned an invalid response (HTTP ${response.status})`);
        }

        if (!json.success) {
            throw new Error(json.message ?? `Request failed (HTTP ${response.status})`);
        }
        return json.content;
    }

    Start(app, branch, version, files) {
        let route = `${encodeURIComponent(app)}/${encodeURIComponent(branch)}/publish/start`;
        return this.Post(route, {version, files});
    }

    Finish(app, branch, versionId) {
        let route = `${encodeURIComponent(app)}/${encodeURIComponent(branch)}/publish/finish`;
        return this.Post(route, {version_id: versionId});
    }
}
