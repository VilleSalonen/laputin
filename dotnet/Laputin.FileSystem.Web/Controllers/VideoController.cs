using Microsoft.AspNetCore.Mvc;

namespace Laputin.FileSystem.Web.Controllers;

[ApiController]
[Route("[controller]")]
public class VideoController : ControllerBase
{
    private readonly ILogger<VideoController> _logger;
    private readonly LaputinContext _context;

    public VideoController(ILogger<VideoController> logger, LaputinContext context)
    {
        _logger = logger;
        _context = context;
    }

    [HttpGet(Name = "GetVideo")]
    public async Task<IActionResult> Get(int? id)
    {
        var file = await _context.LaputinFiles.FindAsync(id);

        if (file == null) {
            return NotFound();
        }

        var filestream = System.IO.File.OpenRead(file.Path);
        return File(filestream, file.Type, enableRangeProcessing: true);
    }
}
