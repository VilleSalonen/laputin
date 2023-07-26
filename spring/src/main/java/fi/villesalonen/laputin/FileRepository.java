package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.FileEntity;
import fi.villesalonen.laputin.records.QueryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Integer> {
    @Query("""
    select f from FileEntity f
    where (:#{#queryRecord.includeInactive} = true or f.active = 1)
    """)
    List<FileEntity> findByQuery(@Param("queryRecord") QueryRecord queryRecord);
}
