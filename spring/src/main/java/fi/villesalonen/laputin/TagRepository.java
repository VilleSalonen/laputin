package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.TagEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<TagEntity, Integer> {
}
