package fi.villesalonen.laputin.builders;

import fi.villesalonen.laputin.records.TagRecord;

import java.util.Random;

public class TagRecordBuilder {
    private int id;
    private String name;
    private final Random random = new Random();

    public TagRecordBuilder withId(int id) {
        this.id = id;
        return this;
    }

    public TagRecordBuilder withName(String name) {
        this.name = name;
        return this;
    }

    public TagRecord build() {
        if (name == null) { this.withName(generateRandomString(10)); }

        return new TagRecord(id, name);
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
