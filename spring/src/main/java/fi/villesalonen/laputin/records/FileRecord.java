package fi.villesalonen.laputin.records;

import java.util.Map;
import java.util.Set;

public record FileRecord(int id, String hash, String path, int active, long size, Map<String, String> metadata, String type, Set<TagRecord> tags) {
}
