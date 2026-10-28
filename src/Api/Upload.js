import fs from "node:fs";
import http from "node:http";
import https from "node:https";

export default class Upload {
    // streams a file to a presigned url, retrying a few times
    static async Put(url, file, mime, onBytes) {
        let lastError;

        for (let attempt = 1; attempt <= 4; attempt++) {
            try {
                await Upload.Once(url, file, mime, onBytes);
                return;
            } catch (err) {
                lastError = err;
                await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
            }
        }

        throw new Error(`Upload of ${file.path} failed: ${lastError.message}`);
    }

    static Once(url, file, mime, onBytes) {
        return new Promise((resolve, reject) => {
            let target = new URL(url);
            let client = target.protocol === "http:" ? http : https;

            let request = client.request(target, {
                method: "PUT",
                headers: {
                    "Content-Type": mime,
                    "Content-Length": file.size
                }
            }, (response) => {
                let body = "";
                response.on("data", (chunk) => body += chunk);
                response.on("end", () => {
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        resolve();
                        return;
                    }
                    reject(new Error(`HTTP ${response.statusCode} ${body.slice(0, 200)}`));
                });
            });

            request.on("error", reject);

            let stream = fs.createReadStream(file.full);
            stream.on("error", reject);
            stream.on("data", (chunk) => onBytes(chunk.length));
            stream.pipe(request);
        });
    }
}
