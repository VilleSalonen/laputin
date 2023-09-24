package fi.villesalonen.laputin.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.util.Map;
import java.util.Set;

@Builder
public record FileRecord(
    @JsonProperty("fileId")
    int id,
    String hash,
    String path,
    boolean active,
    long size,
    Map<String, Object> metadata,
    String type,
    Set<TagRecord> tags)
{
    @JsonProperty("name")
    public String name() {
        return java.nio.file.Paths.get(path).getFileName().toString();
    }
}
