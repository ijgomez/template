package org.myorganization.template.core.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generic base service that unifies the criteria-based read operations shared by
 * most CRUD services: paginated search and count using the Specification pattern.
 * <p>
 * Concrete services provide the entity-specific mapping ({@link #toDTO(Object)})
 * and the {@link Specification} builder for their criteria type
 * ({@link #buildSpecification(Object)}). Create, update, delete and any
 * entity-specific read operations remain in the concrete services, since their
 * logic varies too much to be generalized safely.
 *
 * @param <E> the JPA entity type
 * @param <D> the DTO type returned to callers
 * @param <C> the criteria type used for filtering
 */
public abstract class AbstractCriteriaService<E, D, C> {

    /**
     * Repository providing Specification-based querying for the managed entity.
     */
    protected final JpaSpecificationExecutor<E> specificationExecutor;

    /**
     * @param specificationExecutor the repository supporting Specification queries
     */
    protected AbstractCriteriaService(JpaSpecificationExecutor<E> specificationExecutor) {
        this.specificationExecutor = specificationExecutor;
    }

    /**
     * Maps a managed entity to its DTO representation.
     *
     * @param entity the entity to map
     * @return the corresponding DTO
     */
    protected abstract D toDTO(E entity);

    /**
     * Builds a {@link Specification} from the given criteria.
     *
     * @param criteria the filter criteria
     * @return the specification representing the criteria
     */
    protected abstract Specification<E> buildSpecification(C criteria);

    /**
     * Searches entities matching the given criteria with pagination.
     *
     * @param criteria the filter criteria
     * @param pageable the pagination information
     * @return a page of matching DTOs
     */
    @Transactional(readOnly = true)
    public Page<D> findByCriteria(C criteria, Pageable pageable) {
        return specificationExecutor.findAll(buildSpecification(criteria), pageable).map(this::toDTO);
    }

    /**
     * Counts entities matching the given criteria.
     *
     * @param criteria the filter criteria
     * @return the total count of matching entities
     */
    @Transactional(readOnly = true)
    public long countByCriteria(C criteria) {
        return specificationExecutor.count(buildSpecification(criteria));
    }
}
