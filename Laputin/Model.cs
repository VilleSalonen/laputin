using Microsoft.EntityFrameworkCore;
using System;

namespace Laputin
{
    // migration from old database
    // INSERT INTO Tags SELECT * FROM old.tags;
    // INSERT INTO Files SELECT ROW_NUMBER() OVER (ORDER BY path), * FROM old.files WHERE active = 1;
    // INSERT INTO FileTag SELECT (SELECT Files.Id FROM Files Where Files.Hash = tags_files.hash), id FROM tags_files WHERE tags_files.id IS NOT NULL AND tags_files.hash IN (SELECT hash FROM files WHERE active = 1);
    public class LaputinContext : DbContext
    {
        public LaputinContext()
        {
        }

        public DbSet<File> Files { get; set; }
        public DbSet<Tag> Tags { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder options) =>
            options
                // .EnableSensitiveDataLogging()
                // .LogTo(Console.WriteLine)
                .UseSqlite($"Data Source=Laputin.db");
    }
}
