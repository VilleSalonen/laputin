using Microsoft.EntityFrameworkCore;
using System;
using System.CommandLine;
using System.CommandLine.Invocation;
using System.Linq;
using System.Threading.Tasks;

namespace Laputin
{
    class Program
    {
        public static async Task<int> Main(params string[] args)
        {
            var fileCommand = new Command("file")
            {
                new Option<string>(
                    "--library-path",
                    description: "Laputin path"
                ),
                new Option<string>(
                    "--hash",
                    description: "File hash"
                ),
            };
            fileCommand.Handler = CommandHandler.Create<string, string>(HandleQuery);

            // Create a root command with some options
            var rootCommand = new RootCommand
            {
                fileCommand
            };

            rootCommand.Description = "My sample app";

            // Parse the incoming args and invoke the handler
            return await rootCommand.InvokeAsync(args);
        }

        private static async Task<int> HandleFile(string libraryPath, string hash)
        {
            using var db = new LaputinContext(libraryPath);

            var file = await db.Files
                .Where(f => f.Hash == hash)
                .Include(f => f.Tags)
                .FirstAsync();

            Console.WriteLine(file.Path);
            Console.WriteLine();
            Console.WriteLine($"Tags: {file.Tags.Count}");
            foreach (var tag in file.Tags.OrderBy(t => t.Name))
            {
                Console.WriteLine($"  {tag.Name}");
            }

            return 0;
        }
    }
}
