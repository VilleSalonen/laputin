using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;

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
        public DbSet<Tag> Tags { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder options) =>
            options
                .UseSqlite($"Data Source={LibraryPath}")
                .EnableSensitiveDataLogging()
                .LogTo(Console.WriteLine);

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<File>()
                .HasMany(f => f.Tags)
                .WithMany(t => t.Files)
                .UsingEntity<Dictionary<string, object>>(
                    "tags_files",
                    j => j.HasOne<Tag>().WithMany().HasForeignKey("id"),
                    j => j.HasOne<File>().WithMany().HasForeignKey("hash"),
                    j => j.ToTable("tags_files", "files"));
        }
    }
}
