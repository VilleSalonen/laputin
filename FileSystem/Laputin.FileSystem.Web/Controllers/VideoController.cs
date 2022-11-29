using Microsoft.AspNetCore.Mvc;

namespace Laputin.FileSystem.Web.Controllers;

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
    public IActionResult Get()
    {
        string path = @"foo.mp4";
        var filestream = System.IO.File.OpenRead(path);
        return File(filestream, "video/mp4", enableRangeProcessing: true);
    }
}
