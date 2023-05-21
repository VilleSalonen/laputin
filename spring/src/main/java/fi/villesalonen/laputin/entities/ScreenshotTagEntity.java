package fi.villesalonen.laputin.entities;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "screenshot_tag", schema = "public", catalog = "laputin_db")
public class ScreenshotTagEntity {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private int id;
    @Basic
    @Column(name = "file_id")
    private int fileId;
    @Basic
    @Column(name = "time")
    private double time;

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

    public double getTime() {
        return time;
    }

    public void setTime(double time) {
        this.time = time;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ScreenshotTagEntity that = (ScreenshotTagEntity) o;
        return id == that.id && fileId == that.fileId && Double.compare(that.time, time) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, fileId, time);
    }
}
