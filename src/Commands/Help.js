import Command from "./Command.js";
import {Main} from "../Main.js";

export default class Help extends Command {
    commandName = "help";
    helpMessage = "shows this message";
    usage = "depotrail help";

    async Run(args, flags) {
        console.log("depotrail - publishes builds to an UNTONE depot\n");

        for (const command of Main.commands.values()) {
            console.log(`  ${command.usage}`);
            console.log(`      ${command.helpMessage}\n`);
        }
    }
}
