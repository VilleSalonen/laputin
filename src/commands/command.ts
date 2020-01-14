import commandLineArgs = require('command-line-args');

export interface Command {
    optionDefinitions: commandLineArgs.OptionDefinition[];
    execute(options: any): Promise<void>;
}
