package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.FileEntity;
import fi.villesalonen.laputin.records.QueryRecord;

import java.util.List;

public interface FileRepositoryCustom {
    List<FileEntity> findByQuery(QueryRecord queryRecord);
}
