package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Integer>, FileRepositoryCustom {
}
