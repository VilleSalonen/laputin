package fi.villesalonen.laputin.entities;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "tags_on_timecodes", schema = "public", catalog = "laputin_db")
public class TagsOnTimecodesEntity {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private int id;
    @Basic
    @Column(name = "timecode_id")
    private int timecodeId;
    @Basic
    @Column(name = "tag_id")
    private int tagId;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getTimecodeId() {
        return timecodeId;
    }

    public void setTimecodeId(int timecodeId) {
        this.timecodeId = timecodeId;
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
        TagsOnTimecodesEntity that = (TagsOnTimecodesEntity) o;
        return id == that.id && timecodeId == that.timecodeId && tagId == that.tagId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, timecodeId, tagId);
    }
}
