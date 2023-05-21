package fi.villesalonen.laputin.entities;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "timecodes_on_files", schema = "public", catalog = "laputin_db")
public class TimecodesOnFilesEntity {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private int id;
    @Basic
    @Column(name = "file_id")
    private int fileId;
    @Basic
    @Column(name = "start")
    private double start;
    @Basic
    @Column(name = "end")
    private double end;

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

    public double getStart() {
        return start;
    }

    public void setStart(double start) {
        this.start = start;
    }

    public double getEnd() {
        return end;
    }

    public void setEnd(double end) {
        this.end = end;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TimecodesOnFilesEntity that = (TimecodesOnFilesEntity) o;
        return id == that.id && fileId == that.fileId && Double.compare(that.start, start) == 0 && Double.compare(that.end, end) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, fileId, start, end);
    }
}
