using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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
            fileCommand.Handler = CommandHandler.Create<string, string>(HandleFile);

            var queryCommand = new Command("query")
            {
                new Option<string>(
                    "--library-path",
                    description: "Laputin path"
                ),
                new Option<string>(
                    "--tag",
                    description: "Tag"
                ),
            };
            queryCommand.Handler = CommandHandler.Create<string, string>(HandleQuery);

            // Create a root command with some options
            var rootCommand = new RootCommand
            {
                fileCommand,
                queryCommand
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

        private static async Task<int> HandleQuery(string libraryPath, string tag)
        {
            using var db = new LaputinContext(libraryPath);

            Console.WriteLine(tag);
            var tags = await db.Tags
                .Where(t => t.Name.Contains(tag))
                .ToListAsync();

            foreach (var tagObj in tags)
            {
                Console.WriteLine(tagObj.Name);
            }

            var files = await GetFilesAsync(libraryPath, new Query(null, null, "1630ab03477d5e5f17d5bd6d52425dde", null, null, null, false));
            foreach (var file in files)
            {
                Console.WriteLine(file.Path);
            }

            return 0;
        }

        public class Query
        {
            public string Filename { get; }
            public string Status { get; }
            public string Hash { get; }
            public string And { get; }
            public string Or { get; }
            public string Not { get; }
            public bool IncludeInactive { get; }

            public Query(
                string filename,
                string status,
                string hash,
                string and,
                string or,
                string not,
                bool includeInactive)
            {
                Filename = filename;
                Status = status;
                Hash = hash;
                And = and;
                Or = or;
                Not = not;
                IncludeInactive = includeInactive;
            }
        }

        public static async Task<IList<File>> GetFilesAsync(string libraryPath, Query query) {
            Dictionary<string, File> files = new Dictionary<string, File>();

            var parameters = new List<string>();

            FormattableString sql1 = $"SELECT files.hash, files.path, files.size, files.metadata, files.type FROM files WHERE 1 = 1";
            /*if (!query.IncludeInactive)
            {
                sql1 += " AND active = 1";
            }
            if (!string.IsNullOrWhiteSpace(query.Filename))
            {
                string[] words = query.Filename.Split(" ");
                foreach (var word in words) {
                    sql1 += " AND path LIKE ? COLLATE NOCASE";
                    parameters.Add("%" + word + "%");
                }
            }
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                if (query.Status == "tagged")
                {
                    sql1 += " AND EXISTS (SELECT 1 FROM tags_files WHERE tags_files.hash = files.hash) ";
                }
                if (query.Status == "untagged")
                {
                    sql1 += " AND NOT EXISTS (SELECT 1 FROM tags_files WHERE tags_files.hash = files.hash) ";
                }
            }*/

            if (!string.IsNullOrWhiteSpace(query.Hash))
            {
                sql1 = $"{sql1} AND hash = {query.Hash} ";
                parameters.Add(query.Hash);
            }

            /*if (!string.IsNullOrWhiteSpace(query.And) || !string.IsNullOrWhiteSpace(query.Or) || !string.IsNullOrWhiteSpace(query.Not))
            {
                sql1 += " AND (SELECT COUNT(*) FROM tags_files WHERE tags_files.hash = files.hash) > 0";
            }
            sql1 += GenerateTagFilterQuery(query.And, parameters, "IN", "AND");
            sql1 += GenerateTagFilterQuery(query.Or, parameters, "IN", "OR");
            sql1 += GenerateTagFilterQuery(query.Not, parameters, "NOT IN", "AND");

            sql1 += " ORDER BY path ";*/

            using var db = new LaputinContext(libraryPath);
            return await db.Files
                .FromSqlInterpolated($"SELECT * FROM files WHERE 1 = 1 AND active = 1 AND hash = {query.Hash} ORDER BY path")
                .ToListAsync();

            

            /*const each1 = (err: any, row: any) => {
                        files[row.hash] = new File(
                            row.hash,
                            row.path,
                            [],
                            row.size,
                            row.type,
                            row.metadata ? JSON.parse(row.metadata) : { }
                        );
                    };

            const stmt = this._db.prepare(sql1);
            await stmt.eachAsync(params, each1);

            const sql2 =
                "SELECT tags.id, tags.name, tags_files.hash FROM tags_files JOIN tags ON tags.id = tags_files.id ORDER BY tags.name";
            const each2 = function(err: Error, row: any) {
                        // Tag associations exist for inactive files but inactive files are
                        // not in files list.
                        if (typeof files[row.hash] !== "undefined") {
                files[row.hash].tags.push(new Tag(row.id, row.name, 0));
            }
                    };
            await this._db.eachAsync(sql2, each2);*/
        }

        private static string GenerateTagFilterQuery(
            string ids,
            List<string> parameters,
            string opr1,
            string opr2)
        {
            if (!string.IsNullOrWhiteSpace(ids)) {
                var splitIds = ids.Split(",");
                foreach (var splitId in splitIds)
                {
                    parameters.Add(splitId);
                }

                var wheres = splitIds.Select(splitId =>
                        " files.hash " +
                        opr1 +
                        " (SELECT hash FROM tags_files WHERE id=?) "
                    
                );

                return " AND ( " + string.Join(" " + opr2 + " ", wheres) + " ) ";
            }

            return "";
        }
    }
}
