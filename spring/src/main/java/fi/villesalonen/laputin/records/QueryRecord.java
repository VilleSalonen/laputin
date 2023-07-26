package fi.villesalonen.laputin.records;

public record QueryRecord(
    String filename,
    String[] paths,
    String status,
    String[] hash,
    String and,
    String or,
    String not,
    Boolean includeInactive
) {}
