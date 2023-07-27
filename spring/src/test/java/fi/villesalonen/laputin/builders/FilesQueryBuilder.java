package fi.villesalonen.laputin.builders;

import fi.villesalonen.laputin.records.FileRecord;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class FilesQueryBuilder {
    private static final String BASE_URL = "/files?";

    private final StringBuilder urlBuilder;
    private final List<String> hashList;
    private String filename;
    private List<String> paths;
    private String status;
    private String and;
    private String or;
    private String not;
    private Boolean includeInactive;

    public FilesQueryBuilder() {
        this.urlBuilder = new StringBuilder(BASE_URL);
        this.hashList = new ArrayList<>();
    }

    public FilesQueryBuilder withFilename(String filename) {
        this.filename = filename;
        return this;
    }

    public FilesQueryBuilder withPaths(String... paths) {
        this.paths = List.of(paths);
        return this;
    }

    public FilesQueryBuilder withStatus(String status) {
        this.status = status;
        return this;
    }

    public FilesQueryBuilder withAnd(String and) {
        this.and = and;
        return this;
    }

    public FilesQueryBuilder withOr(String or) {
        this.or = or;
        return this;
    }

    public FilesQueryBuilder withNot(String not) {
        this.not = not;
        return this;
    }

    public FilesQueryBuilder includeInactive() {
        return includeInactive(true);
    }

    public FilesQueryBuilder includeInactive(boolean includeInactive) {
        this.includeInactive = includeInactive;
        return this;
    }

    public FilesQueryBuilder queryByHash(FileRecord... files) {
        for (FileRecord file : files) {
            hashList.add(file.hash());
        }
        return this;
    }

    public FilesQueryBuilder queryByPath(FileRecord... files) {
        for (FileRecord file : files) {
            hashList.add(file.path());
        }
        return this;
    }

    public String build() {
        if (filename != null) {
            urlBuilder.append("filename=").append(filename).append("&");
        }
        if (paths != null) {
            paths.forEach(path -> urlBuilder.append("paths=").append(path).append("&"));
        }
        if (status != null) {
            urlBuilder.append("status=").append(status).append("&");
        }
        if (and != null) {
            urlBuilder.append("and=").append(and).append("&");
        }
        if (or != null) {
            urlBuilder.append("or=").append(or).append("&");
        }
        if (not != null) {
            urlBuilder.append("not=").append(not).append("&");
        }
        if (includeInactive != null) {
            urlBuilder.append("includeInactive=").append(includeInactive).append("&");
        }
        if (!hashList.isEmpty()) {
            String hashParams = hashList.stream()
                .map(hash -> "hash=" + hash)
                .collect(Collectors.joining("&"));
            urlBuilder.append(hashParams);
        }
        return urlBuilder.toString();
    }
}
