package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.FileEntity;
import fi.villesalonen.laputin.records.QueryRecord;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

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

        if (queryRecord.filename() != null) {
            for (String filename : queryRecord.filename().split(" ")) {
                predicates.add(cb.like(cb.upper(file.get("path")), "%" + filename.toUpperCase() + "%"));
            }
        }

        query.where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(query).getResultList();
    }
}
