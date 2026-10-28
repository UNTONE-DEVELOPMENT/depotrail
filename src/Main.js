import Args from "./Utils/Args.js";
import Help from "./Commands/Help.js";
import Publish from "./Commands/Publish.js";

export class Main {
    static commands = new Map();

    async Init() {
        Main.Register(new Help());
        Main.Register(new Publish());

        let parsed = Args.Parse(process.argv.slice(2));
        let name = parsed.positional.shift() ?? "help";

        let command = Main.commands.get(name);
        if (!command) {
            console.error(`Unknown command "${name}"`);
            command = Main.commands.get("help");
            process.exitCode = 1;
        }

        try {
            await command.Run(parsed.positional, parsed.flags);
        } catch (err) {
            console.error(`\n${err instanceof Error ? err.message : String(err)}`);
            process.exitCode = 1;
        }
    }

    static Register(command) {
        Main.commands.set(command.commandName, command);
    }
}
