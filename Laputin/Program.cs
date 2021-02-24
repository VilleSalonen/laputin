using System;
using System.CommandLine;
using System.CommandLine.Invocation;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Laputin
{
    class Program
    {
        public static async Task<int> Main(params string[] args)
        {
            // Create a root command with some options
            var rootCommand = new RootCommand
            {
                new Option<string>(
                    "--library-path",
                    description: "Laputin path"),
            };

            rootCommand.Description = "My sample app";

            // Note that the parameters of the handler method are matched according to the names of the options
            rootCommand.Handler = CommandHandler.Create<string>((libraryPath) =>
            {
                using (var db = new LaputinContext(libraryPath))
                {
                    // Note: This sample requires the database to be created before running.

                    // Create
                    // Console.WriteLine("Inserting a new blog");
                    // db.Add(new Blog { Url = "http://blogs.msdn.com/adonet" });
                    // db.SaveChanges();

                    // Read
                    Console.WriteLine("Querying for a file");
                    var file = db.Files
                        .First();
                    Console.WriteLine(file.Path);

                    // Update
                    //Console.WriteLine("Updating the blog and adding a post");
                    //blog.Url = "https://devblogs.microsoft.com/dotnet";
                    //blog.Posts.Add(
                    //    new Post { Title = "Hello World", Content = "I wrote an app using EF Core!" });
                    //db.SaveChanges();

                    // Delete
                    //Console.WriteLine("Delete the blog");
                    //db.Remove(blog);
                    //db.SaveChanges();
                }

                Console.WriteLine($"The value for --library-path is: {libraryPath}");
            });

            // Parse the incoming args and invoke the handler
            return rootCommand.InvokeAsync(args).Result;
        }
    }
}
