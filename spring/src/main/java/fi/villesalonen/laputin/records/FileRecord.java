package fi.villesalonen.laputin.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.util.List;
import java.util.Map;

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
    List<TagRecord> tags)
{
    @JsonProperty("name")
    public String name() {
        return java.nio.file.Paths.get(path).getFileName().toString();
    }
}
