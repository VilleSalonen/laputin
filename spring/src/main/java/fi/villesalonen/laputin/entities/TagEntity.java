package fi.villesalonen.laputin.entities;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "tag", schema = "public", catalog = "laputin_db")
public class TagEntity {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private int id;
    @Basic
    @Column(name = "name")
    private String name;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TagEntity tagEntity = (TagEntity) o;
        return id == tagEntity.id && Objects.equals(name, tagEntity.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
}