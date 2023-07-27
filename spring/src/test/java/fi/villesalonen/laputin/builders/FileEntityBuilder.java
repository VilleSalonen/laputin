package fi.villesalonen.laputin.builders;

import fi.villesalonen.laputin.entities.FileEntity;
import fi.villesalonen.laputin.entities.TagEntity;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Random;

public class FileEntityBuilder {

    private final FileEntity fileEntity;
    private final Random random;
    private boolean activeSet = false;

    public FileEntityBuilder() {
        this.fileEntity = new FileEntity();
        this.random = new Random();
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

    public FileEntityBuilder withId(int id) {
        this.fileEntity.setId(id);
        return this;
    }

    public FileEntityBuilder withHash(String hash) {
        this.fileEntity.setHash(hash != null ? hash : generateRandomString(10));
        return this;
    }

    public FileEntityBuilder withPath(String path) {
        this.fileEntity.setPath(path != null ? path : "/path/to/" + generateRandomString(10));
        return this;
    }

    public FileEntityBuilder withActive(int active) {
        this.fileEntity.setActive(active);
        this.activeSet = true;
        return this;
    }

    public FileEntityBuilder withSize(long size) {
        this.fileEntity.setSize(size > 0 ? size : random.nextLong());
        return this;
    }

    public FileEntityBuilder withMetadata(HashMap<String, String> metadata) {
        this.fileEntity.setMetadata(metadata != null ? metadata : new HashMap<>());
        return this;
    }

    public FileEntityBuilder withType(String type) {
        this.fileEntity.setType(type != null ? type : "image/jpeg");
        return this;
    }

    public FileEntityBuilder withTags(HashSet<TagEntity> tags) {
        this.fileEntity.setTags(tags != null ? tags : new HashSet<>());
        return this;
    }

    public FileEntity build() {
        // Apply random values for all properties not already set
        if(this.fileEntity.getHash() == null) this.withHash(null);
        if(this.fileEntity.getPath() == null) this.withPath(null);
        if(this.fileEntity.getMetadata() == null) this.withMetadata(null);
        if(this.fileEntity.getType() == null) this.withType(null);
        if(this.fileEntity.getTags() == null) this.withTags(null);
        if(this.fileEntity.getSize() == 0) this.withSize(-1);
        if(!this.activeSet) this.withActive(1);

        return this.fileEntity;
    }
}
