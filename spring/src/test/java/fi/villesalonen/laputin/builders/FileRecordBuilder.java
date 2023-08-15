package fi.villesalonen.laputin.builders;

import fi.villesalonen.laputin.records.FileRecord;
import fi.villesalonen.laputin.records.TagRecord;

import java.util.*;

public class FileRecordBuilder {
    private int id;
    private String hash;
    private String path;
    private Boolean active;
    private Long size;
    private Map<String, Object> metadata;
    private String type;
    private Set<TagRecord> tags;
    private final Random random = new Random();

    public FileRecordBuilder withId(int id) {
        this.id = id;
        return this;
    }

    public FileRecordBuilder withHash(String hash) {
        this.hash = hash != null ? hash : generateRandomString(10);
        return this;
    }

    public FileRecordBuilder withPath(String path) {
        this.path = path != null ? path : "/path/to/" + generateRandomString(10);
        return this;
    }

    public FileRecordBuilder withActive(Boolean active) {
        this.active = active;
        return this;
    }

    public FileRecordBuilder withSize(Long size) {
        this.size = size != null && size > 0 ? size : random.nextLong();
        return this;
    }

    public FileRecordBuilder withMetadata(Map<String, Object> metadata) {
        this.metadata = metadata != null ? metadata : new HashMap<>();
        return this;
    }

    public FileRecordBuilder withType(String type) {
        this.type = type != null ? type : "image/jpeg";
        return this;
    }

    public FileRecordBuilder withTags(Set<TagRecord> tags) {
        this.tags = tags != null ? tags : new HashSet<>();
        return this;
    }

    public FileRecord build() {
        // Apply random values for all properties not already set
        if(this.hash == null) this.withHash(null);
        if(this.path == null) this.withPath(null);
        if(this.metadata == null) this.withMetadata(null);
        if(this.type == null) this.withType(null);
        if(this.tags == null) this.withTags(null);
        if(this.size == null) this.withSize(null);
        if(this.active == null) this.withActive(true);

        return new FileRecord(id, hash, path, active, size, metadata, type, tags);
    }

    private String generateRandomString(int length) {
        String characters = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = random.nextInt(characters.length());
            sb.append(characters.charAt(index));
        }
        return sb.toString();
    }
}
