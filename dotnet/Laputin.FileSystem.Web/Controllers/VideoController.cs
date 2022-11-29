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

    [HttpGet(Name = "Video_Get")]
    [ProducesResponseType(typeof(File), StatusCodes.Status206PartialContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int? id)
    {
        var file = await _context.LaputinFiles.FindAsync(id);
        return file != null
            ? File(System.IO.File.OpenRead(file.Path), file.Type, enableRangeProcessing: true)
            : NotFound();
    }
}
