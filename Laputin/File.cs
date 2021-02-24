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
        //public List<TagFile> TagFiles { get; set; }
    }

    [Table("tags")]
    public class Tag
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("name")]
        public string Name { get; set; }

        public ICollection<File> Files { get; set; }
        //public List<TagFile> TagFiles { get; set; }
    }

    [Table("tags_files")]
    public class TagFile
    {
        [Column("id")]
        public int TagId { get; set; }
        public Tag Tag { get; set; }

        [Column("hash")]
        public string Hash { get; set; }
        public File File { get; set; }
    }
}
