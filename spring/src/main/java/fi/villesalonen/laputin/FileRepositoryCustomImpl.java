package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.FileEntity;
import fi.villesalonen.laputin.entities.TagEntity;
import fi.villesalonen.laputin.records.QueryRecord;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class FileRepositoryCustomImpl implements FileRepositoryCustom {
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<FileEntity> findByQuery(QueryRecord queryRecord) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<FileEntity> query = cb.createQuery(FileEntity.class);
        Root<FileEntity> file = query.from(FileEntity.class);
        List<Predicate> predicates = new ArrayList<>();

        if (!queryRecord.includeInactive()) {
            predicates.add(cb.equal(file.get("active"), 1));
        }

        if (queryRecord.hash() != null) {
            predicates.add(file.get("hash").in(Arrays.asList(queryRecord.hash())));
        }

        if (queryRecord.paths() != null) {
            List<Predicate> pathPredicates = new ArrayList<>();
            for (String path : queryRecord.paths()) {
                pathPredicates.add(cb.like(cb.upper(file.get("path")), path.toUpperCase() + "%"));
            }
            predicates.add(cb.or(pathPredicates.toArray(new Predicate[0])));
        }

        if (queryRecord.filename() != null) {
            for (String filename : queryRecord.filename().split(" ")) {
                predicates.add(cb.like(cb.upper(file.get("path")), "%" + filename.toUpperCase() + "%"));
            }
        }

        if (queryRecord.and() != null) {
            for (Integer tagId : queryRecord.and()) {
                Join<FileEntity, TagEntity> tagJoin = file.join("tags");
                predicates.add(cb.equal(tagJoin.get("id"), tagId));
            }
        }

        if(queryRecord.or() != null) {
            Join<FileEntity, TagEntity> tagJoin = file.join("tags");
            predicates.add(tagJoin.get("id").in(Arrays.asList(queryRecord.or())));
        }

        if (queryRecord.not() != null) {
            // Create a subquery to get all file entities that have undesired tags.
            Subquery<Integer> tagSubquery = query.subquery(Integer.class);
            Root<TagEntity> tagRoot = tagSubquery.from(TagEntity.class);
            Join<TagEntity, FileEntity> fileJoin = tagRoot.join("files"); // Assumes "files" is the mappedBy value in @ManyToMany
            tagSubquery.select(fileJoin.get("id"));
            tagSubquery.where(tagRoot.get("id").in((Object[]) queryRecord.not()));

            // In main query, add a predicate that a file's ID should not be in the list from subquery.
            predicates.add(cb.not(file.get("id").in(tagSubquery)));
        }

        if (queryRecord.status() != null) {
            switch (queryRecord.status()) {
                // Files must have at least one tag
                case Tagged -> predicates.add(cb.isNotEmpty(file.get("tags")));
                // Files must not have any tags
                case Untagged -> predicates.add(cb.isEmpty(file.get("tags")));
                case Both -> {}
                default -> throw new IllegalStateException("Unexpected status: " + queryRecord.status());
            }
        }

        query.where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(query).getResultList();
    }
}
