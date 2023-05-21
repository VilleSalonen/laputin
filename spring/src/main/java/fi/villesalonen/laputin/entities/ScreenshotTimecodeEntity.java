package fi.villesalonen.laputin.entities;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "screenshot_timecode", schema = "public", catalog = "laputin_db")
public class ScreenshotTimecodeEntity {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private int id;
    @Basic
    @Column(name = "time")
    private double time;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
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
        ScreenshotTimecodeEntity that = (ScreenshotTimecodeEntity) o;
        return id == that.id && Double.compare(that.time, time) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, time);
    }
}
