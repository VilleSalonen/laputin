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

@SuppressWarnings("unused")
public class FileRepositoryCustomImpl implements FileRepositoryCustom {
    private static final String ACTIVE_FIELD = "active";
    private static final String HASH_FIELD = "hash";
    private static final String PATH_FIELD = "path";
    private static final String TAGS_FIELD = "tags";
    private static final String ID_FIELD = "id";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<FileEntity> findByQuery(QueryRecord queryRecord) {
        if(queryRecord == null) {
            throw new IllegalArgumentException("queryRecord cannot be null");
        }

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<FileEntity> query = cb.createQuery(FileEntity.class);
        Root<FileEntity> file = query.from(FileEntity.class);

        List<Predicate> predicates = createPredicatesFromQuery(cb, query, file, queryRecord);

        query.where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(query).getResultList();
    }

    private List<Predicate> createPredicatesFromQuery(CriteriaBuilder cb, CriteriaQuery<FileEntity> query, Root<FileEntity> file, QueryRecord queryRecord) {
        List<Predicate> predicates = new ArrayList<>();

        addActivePredicateIfNecessary(cb, file, queryRecord, predicates);
        addHashPredicateIfNecessary(cb, file, queryRecord, predicates);
        addPathsPredicateIfNecessary(cb, file, queryRecord, predicates);
        addFilenamePredicateIfNecessary(cb, file, queryRecord, predicates);
        addAndPredicateIfNecessary(cb, file, queryRecord, predicates);
        addOrPredicateIfNecessary(cb, file, queryRecord, predicates);
        addNotPredicateIfNecessary(cb, query, file, queryRecord, predicates);
        addStatusPredicateIfNecessary(cb, file, queryRecord, predicates);

        return predicates;
    }

    private void addActivePredicateIfNecessary(CriteriaBuilder cb, Root<FileEntity> file, QueryRecord queryRecord, List<Predicate> predicates) {
        if (!queryRecord.includeInactive()) {
            predicates.add(cb.equal(file.get(ACTIVE_FIELD), 1));
        }
    }

    private void addHashPredicateIfNecessary(CriteriaBuilder cb, Root<FileEntity> file, QueryRecord queryRecord, List<Predicate> predicates) {
        if (queryRecord.hash() != null) {
            predicates.add(file.get(HASH_FIELD).in(Arrays.asList(queryRecord.hash())));
        }
    }

    private void addPathsPredicateIfNecessary(CriteriaBuilder cb, Root<FileEntity> file, QueryRecord queryRecord, List<Predicate> predicates) {
        if (queryRecord.paths() != null) {
            List<Predicate> pathPredicates = new ArrayList<>();
            for (String path : queryRecord.paths()) {
                pathPredicates.add(cb.like(cb.upper(file.get(PATH_FIELD)), path.toUpperCase() + "%"));
            }
            predicates.add(cb.or(pathPredicates.toArray(new Predicate[0])));
        }
    }

    private void addFilenamePredicateIfNecessary(CriteriaBuilder cb, Root<FileEntity> file, QueryRecord queryRecord, List<Predicate> predicates) {
        if (queryRecord.filename() != null) {
            for (String filename : queryRecord.filename().split(" ")) {
                predicates.add(cb.like(cb.upper(file.get(PATH_FIELD)), "%" + filename.toUpperCase() + "%"));
            }
        }
    }

    private void addAndPredicateIfNecessary(CriteriaBuilder cb, Root<FileEntity> file, QueryRecord queryRecord, List<Predicate> predicates) {
        if (queryRecord.and() != null) {
            for (Integer tagId : queryRecord.and()) {
                Join<FileEntity, TagEntity> tagJoin = file.join(TAGS_FIELD);
                predicates.add(cb.equal(tagJoin.get(ID_FIELD), tagId));
            }
        }
    }

    private void addOrPredicateIfNecessary(CriteriaBuilder cb, Root<FileEntity> file, QueryRecord queryRecord, List<Predicate> predicates) {
        if(queryRecord.or() != null) {
            Join<FileEntity, TagEntity> tagJoin = file.join(TAGS_FIELD);
            predicates.add(tagJoin.get(ID_FIELD).in(Arrays.asList(queryRecord.or())));
        }
    }

    private void addNotPredicateIfNecessary(CriteriaBuilder cb, CriteriaQuery<FileEntity> query, Root<FileEntity> file, QueryRecord queryRecord, List<Predicate> predicates) {
        if (queryRecord.not() != null) {
            // Create a subquery to get all file entities that have undesired tags.
            Subquery<Integer> tagSubquery = createSubqueryForNotPredicate(cb, query, queryRecord);
            // In main query, add a predicate that a file's ID should not be in the list from subquery.
            predicates.add(cb.not(file.get(ID_FIELD).in(tagSubquery)));
        }
    }

    private Subquery<Integer> createSubqueryForNotPredicate(CriteriaBuilder cb, CriteriaQuery<FileEntity> query, QueryRecord queryRecord) {
        Subquery<Integer> tagSubquery = query.subquery(Integer.class);
        Root<TagEntity> tagRoot = tagSubquery.from(TagEntity.class);
        Join<TagEntity, FileEntity> fileJoin = tagRoot.join("files"); // Assumes "files" is the mappedBy value in @ManyToMany
        tagSubquery.select(fileJoin.get(ID_FIELD));
        tagSubquery.where(tagRoot.get(ID_FIELD).in((Object[]) queryRecord.not()));
        return tagSubquery;
    }

    private void addStatusPredicateIfNecessary(CriteriaBuilder cb, Root<FileEntity> file, QueryRecord queryRecord, List<Predicate> predicates) {
        if (queryRecord.status() != null) {
            switch (queryRecord.status()) {
                case Tagged -> predicates.add(cb.isNotEmpty(file.get(TAGS_FIELD)));
                case Untagged -> predicates.add(cb.isEmpty(file.get(TAGS_FIELD)));
                case Both -> {} // Do nothing
                default -> throw new IllegalStateException("Unexpected status: " + queryRecord.status());
            }
        }
    }
}
