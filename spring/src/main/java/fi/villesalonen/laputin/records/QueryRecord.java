package fi.villesalonen.laputin.records;

public record QueryRecord(
    String filename,
    String[] paths,
    String status,
    String[] hash,
    Integer[] and,
    Integer[] or,
    Integer[] not,
    Boolean includeInactive
) {}
