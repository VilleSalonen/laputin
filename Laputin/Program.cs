using System;
using System.Linq;

namespace Laputin
{
    class Program
    {
        private static void Main()
        {
            using (var db = new LaputinContext())
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
        }
    }
}
