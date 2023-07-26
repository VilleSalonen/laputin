package fi.villesalonen.laputin;

import fi.villesalonen.laputin.records.FileRecord;
import fi.villesalonen.laputin.records.QueryRecord;
import fi.villesalonen.laputin.records.TagRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FileService {
    private final FileRepository fileRepository;

    @Autowired
    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    public List<FileRecord> getFiles(QueryRecord queryRecord) {
        var entities = queryRecord.includeInactive()
            ? fileRepository.findAll()
            : fileRepository.findByActive(1);
        return entities.stream().map(entity -> FileRecord.builder()
            .id(entity.getId())
            .hash(entity.getHash())
            .path(entity.getPath())
            .active(entity.getActive() == 1)
            .size(entity.getSize())
            .metadata(entity.getMetadata())
            .type(entity.getType())
            .tags(entity.getTags().stream().map(tag -> TagRecord.builder()
                .id(tag.getId())
                .name(tag.getName()).build()).collect(Collectors.toSet()))
            .build()).collect(Collectors.toList());
    }

    public FileRecord getFile(int id) {
        var entity = fileRepository.findById(id).orElseThrow();
        return new FileRecord(
            entity.getId(),
            entity.getHash(),
            entity.getPath(),
            entity.getActive() == 1,
            entity.getSize(),
            entity.getMetadata(),
            entity.getType(),
            entity.getTags().stream().map(tag -> new TagRecord(tag.getId(), tag.getName())).collect(Collectors.toSet()));
    }
}
