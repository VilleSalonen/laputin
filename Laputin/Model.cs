using Microsoft.EntityFrameworkCore;
using System;

namespace Laputin
{
    public class LaputinContext : DbContext
    {
        private string LibraryPath;

        public LaputinContext(string libraryPath)
        {
            LibraryPath = libraryPath;
        }

        public DbSet<File> Files { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder options) =>
            options
                .UseSqlite($"Data Source={LibraryPath}");
                //.LogTo(Console.WriteLine);
    }
}
