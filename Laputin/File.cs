using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Laputin
{
    [Table("files")]
    public class File
    {
        [Key]
        [Column("hash")]
        public string Hash { get; set; }

        [Column("path")]
        public string Path { get; set; }

        public ICollection<Tag> Tags { get; set; }
    }
}
