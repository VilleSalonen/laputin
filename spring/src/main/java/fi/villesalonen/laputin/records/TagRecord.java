package fi.villesalonen.laputin.records;

import lombok.Builder;

@Builder
public record TagRecord(int id, String name) {
}
