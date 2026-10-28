// flags that don't take a value, everything else eats the next argument
const BOOLEAN_FLAGS = ["dry-run", "help"];

export default class Args {
    static Parse(argv) {
        let positional = [];
        let flags = {};

        for (let i = 0; i < argv.length; i++) {
            let arg = argv[i];

            if (!arg.startsWith("--")) {
                positional.push(arg);
                continue;
            }

            let name = arg.slice(2);
            if (name.includes("=")) {
                let split = name.indexOf("=");
                flags[name.slice(0, split)] = name.slice(split + 1);
                continue;
            }

            if (BOOLEAN_FLAGS.includes(name)) {
                flags[name] = true;
                continue;
            }

            flags[name] = argv[i + 1];
            i++;
        }

        return {positional, flags};
    }
}
