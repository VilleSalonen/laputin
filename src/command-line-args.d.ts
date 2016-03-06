declare module "command-line-args" {
    function commandLineArgs(arguments: any[]): CommandLineArgs;
    export = commandLineArgs;
    
    class CommandLineArgs {
        public parse(): any;
        public getUsage(): any;
    }
}