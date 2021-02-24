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

            /*modelBuilder.Entity<TagFile>()
                .ToTable("tags_files")
                .HasKey(tf => new { tf.TagId, tf.Hash });

            modelBuilder.Entity<TagFile>()
                .ToTable("tags_files")
                .HasOne(tagFile => tagFile.Tag)
                .WithMany(tag => tag.TagFiles)
                .HasForeignKey(t => t.TagId);

            modelBuilder.Entity<TagFile>()
                .ToTable("tags_files")
                .HasOne(tagFile => tagFile.File)
                .WithMany(tag => tag.TagFiles)
                .HasForeignKey(t => t.Hash);*/

            //modelBuilder.Entity<File>()
            //    .HasMany(f => f.Tags)
            //    .WithMany(f => f.Files)
            //    .UsingEntity<TagFile>(
            //        j => j
            //            .HasOne(tagFile => tagFile.Tag)
            //            .WithMany(tf => tf.TagFiles)
            //            .HasForeignKey(tf => tf.TagId),
            //        j => j
            //            .HasOne(tagFile => tagFile.File)
            //            .WithMany(tf => tf.TagFiles)
            //            .HasForeignKey(tf => tf.Hash),
            //        j => j
            //            .HasKey(tf => new { tf.TagId, tf.Hash })
            //    );

            //.UsingEntity<TagFile>(
            //        j => j
            //            .HasOne(tagFile => tagFile.Tag)
            //            .WithMany(tf => tf.TagFiles)
            //            .HasForeignKey(tf => tf.TagId),
            //        j => j
            //            .HasOne(tagFile => tagFile.File)
            //            .WithMany(tf => tf.TagFiles)
            //            .HasForeignKey(tf => tf.Hash),
            //        j => j
            //            .HasKey(tf => new { tf.TagId, tf.Hash })
            //    );
        }
    }
}
