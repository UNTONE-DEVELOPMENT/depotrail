export default class Format {
    static Bytes(bytes) {
        const units = ["B", "KB", "MB", "GB", "TB"];
        let value = bytes;
        let unit = 0;

        while (value >= 1024 && unit < units.length - 1) {
            value /= 1024;
            unit++;
        }

        let digits = unit === 0 ? 0 : 1;
        return `${value.toFixed(digits)} ${units[unit]}`;
    }

    // overwrites the current line when we're in a terminal, otherwise prints nothing
    static Status(text) {
        if (!process.stdout.isTTY) {
            return;
        }
        process.stdout.write(`\r\x1b[K${text}`);
    }

    static EndStatus() {
        if (process.stdout.isTTY) {
            process.stdout.write("\r\x1b[K");
        }
    }
}
