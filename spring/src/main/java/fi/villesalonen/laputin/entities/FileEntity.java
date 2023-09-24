package fi.villesalonen.laputin.entities;

import fi.villesalonen.laputin.records.FileRecord;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.hibernate.annotations.Type;

import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "file", schema = "public", catalog = "laputin_db")
public class FileEntity {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private int id;
    @Basic
    @Column(name = "hash")
    private String hash;
    @Basic
    @Column(name = "path")
    private String path;
    @Basic
    @Column(name = "active")
    private int active;
    @Basic
    @Column(name = "size")
    private long size;
    @Type(JsonType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;
    @Basic
    @Column(name = "type")
    private String type;
    @ManyToMany
    @JoinTable(
        name = "tags_on_files",
        joinColumns = @JoinColumn(name = "file_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @OrderBy("name ASC")
    private Set<TagEntity> tags;

    public Set<TagEntity> getTags() {
        return tags;
    }

    public void setTags(Set<TagEntity> tags) {
        this.tags = tags;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public int getActive() {
        return active;
    }

    public void setActive(int active) {
        this.active = active;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FileEntity that = (FileEntity) o;
        return id == that.id && active == that.active && size == that.size && Objects.equals(hash, that.hash) && Objects.equals(path, that.path) && Objects.equals(metadata, that.metadata) && Objects.equals(type, that.type);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, hash, path, active, size, metadata, type);
    }

    public static FileRecord toRecord(FileEntity fileEntity) {
        return FileRecord.builder()
            .id(fileEntity.id)
            .hash(fileEntity.hash)
            .path(fileEntity.path)
            .active(fileEntity.active == 1)
            .size(fileEntity.size)
            .metadata(fileEntity.metadata)
            .type(fileEntity.type)
            .tags(fileEntity.tags.stream().map(TagEntity::toRecord).collect(Collectors.toList()))
            .build();
    }

    public static FileEntity fromRecord(FileRecord record) {
        var entity = new FileEntity();
        entity.setId(record.id());
        entity.setHash(record.hash());
        entity.setPath(record.path());
        entity.setActive(record.active() ? 1 : 0);
        entity.setSize(record.size());
        entity.setMetadata(record.metadata());
        entity.setType(record.type());
        entity.setTags(record.tags().stream().map(TagEntity::fromRecord).collect(Collectors.toSet()));
        return entity;
    }
}
