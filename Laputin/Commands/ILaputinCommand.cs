using System.CommandLine;

namespace Laputin.Commands
{
    public interface ILaputinCommand
    {
        Command Command { get; }
    }
}
