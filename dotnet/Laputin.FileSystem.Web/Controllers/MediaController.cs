using Microsoft.AspNetCore.Mvc;

namespace Laputin.FileSystem.Web.Controllers;

[ApiController]
[Route("/media")]
public class MediaController : ControllerBase
{
    private readonly ILogger<MediaController> _logger;
    private readonly LaputinContext _context;

    public MediaController(ILogger<MediaController> logger, LaputinContext context)
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
