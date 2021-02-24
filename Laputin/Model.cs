using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Laputin
{
    public class LaputinContext : DbContext
    {
        public DbSet<File> Files { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder options) =>
            options
                .UseSqlite(@"Data Source=C:\Github\.laputin.db");
                //.LogTo(Console.WriteLine);
    }

    [Table("files")]
    public class File
    {
        [Key]
        [Column("hash")]
        public string Hash { get; set; }

        [Column("path")]
        public string Path { get; set; }
    }
}
