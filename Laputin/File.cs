using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Laputin
{
    public class File
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Hash { get; set; }

        [Required]
        public string Path { get; set; }

        [Required]
        public bool Active { get; set; }

        [Required]
        public long Size { get; set; }

        [Required]
        public string Metadata { get; set; }

        [Required]
        public string Type { get; set; }

        public ICollection<Tag> Tags { get; set; }
    }
}
