package fi.villesalonen.laputin.entities;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "tags_on_files", schema = "public", catalog = "laputin_db")
public class TagsOnFilesEntity {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private int id;
    @Basic
    @Column(name = "file_id")
    private int fileId;
    @Basic
    @Column(name = "tag_id")
    private int tagId;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getFileId() {
        return fileId;
    }

    public void setFileId(int fileId) {
        this.fileId = fileId;
    }

    public int getTagId() {
        return tagId;
    }

    public void setTagId(int tagId) {
        this.tagId = tagId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TagsOnFilesEntity that = (TagsOnFilesEntity) o;
        return id == that.id && fileId == that.fileId && tagId == that.tagId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, fileId, tagId);
    }
}
