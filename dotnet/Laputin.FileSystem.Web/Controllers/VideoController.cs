using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Laputin.FileSystem.Web.Controllers;

[Table("file")]
public class LaputinFile {
    [Column("id")]
    public int Id { get; set;}

    [Column("hash")]
    public string? Hash {get; set;}

    [Column("path")]
    public string? Path {get; set;}
}

public class LaputinContext : DbContext
{
    public DbSet<LaputinFile>? LaputinFiles { get; set; }

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
    public async Task<IActionResult> Get()
    {
        var context = new LaputinContext();
        var file = await context.LaputinFiles.FirstAsync();

        var filestream = System.IO.File.OpenRead(file.Path);
        return File(filestream, "video/mp4", enableRangeProcessing: true);
    }
}
