using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

[Table("file")]
public class LaputinFile
{
    [Column("id")]
    public int Id { get; private set; }

    [Column("hash")]
    public string Hash { get; private set; }

    [Column("path")]
    public string Path { get; private set; }

    [Column("active")]
    public int Active { get; private set; }

    [Column("size")]
    public long Size { get; private set; }

    [Column("metadata")]
    public string Metadata { get; private set; }

    [Column("type")]
    public string Type { get; private set; }

    public LaputinFile(
        int id,
        string hash,
        string path,
        int active,
        long size,
        string metadata,
        string type
    )
    {
        Id = id;
        Hash = hash;
        Path = path;
        Active = active;
        Size = size;
        Metadata = metadata;
        Type = type;
    }
}

public class LaputinContext : DbContext
{
    private readonly IConfiguration _configuration;

    public DbSet<LaputinFile> LaputinFiles => Set<LaputinFile>();

    protected override void OnConfiguring(
        DbContextOptionsBuilder optionsBuilder
    ) => optionsBuilder.UseNpgsql(_configuration["Laputin:ConnectionString"]);

    public LaputinContext(IConfiguration configuration)
    {
        _configuration = configuration;
    }
}
