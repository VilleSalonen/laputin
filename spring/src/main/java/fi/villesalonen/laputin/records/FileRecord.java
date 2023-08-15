package fi.villesalonen.laputin.records;

import lombok.Builder;

import java.util.Map;
import java.util.Set;

@Builder
public record FileRecord(
    int id,
    String hash,
    String path,
    boolean active,
    long size,
    Map<String, Object> metadata,
    String type,
    Set<TagRecord> tags) {
}
