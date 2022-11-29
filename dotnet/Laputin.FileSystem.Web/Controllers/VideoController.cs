using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Laputin.FileSystem.Web.Controllers;

[Table("file")]
public class LaputinFile {
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

    public LaputinFile(int id, string hash, string path, int active, long size, string metadata, string type) {
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
    public DbSet<LaputinFile> LaputinFiles => Set<LaputinFile>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseNpgsql("TODO");
}

[ApiController]
[Route("[controller]")]
public class VideoController : ControllerBase
{
    private readonly ILogger<VideoController> _logger;

    public VideoController(ILogger<VideoController> logger)
    {
        _logger = logger;
    }

    [HttpGet(Name = "GetVideo")]
    public async Task<IActionResult> Get(int? id)
    {
        var context = new LaputinContext();
        var file = await context.LaputinFiles.FindAsync(id);

        if (file == null) {
            return NotFound();
        }

        var filestream = System.IO.File.OpenRead(file.Path);
        return File(filestream, file.Type, enableRangeProcessing: true);
    }
}
