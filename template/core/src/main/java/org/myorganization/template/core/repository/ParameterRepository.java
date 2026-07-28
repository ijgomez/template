package org.myorganization.template.core.repository;

import java.util.Optional;

import org.myorganization.template.domain.entity.Parameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for Parameter entity.
 * <p>
 * Extends {@link JpaSpecificationExecutor} to support dynamic criteria-based
 * filtering using the Specification pattern.
 */
@Repository
public interface ParameterRepository extends JpaRepository<Parameter, Long>, JpaSpecificationExecutor<Parameter> {

    /**
     * Finds a parameter by its unique code.
     *
     * @param code the parameter code
     * @return an Optional containing the parameter if found
     */
    Optional<Parameter> findByCode(String code);

    /**
     * Checks whether a parameter with the given code already exists.
     *
     * @param code the parameter code to check
     * @return {@code true} if a parameter with the code exists
     */
    boolean existsByCode(String code);
}
