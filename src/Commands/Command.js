export default class Command {
    commandName = "";
    helpMessage = "";
    usage = "";

    async Run(args, flags) {
        throw new Error("Command didn't implement Run");
    }
}
