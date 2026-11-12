/**
 * JPA entity classes representing the persistent domain model.
 * <p>
 * Uses Jakarta Persistence API only — no Spring dependencies.
 * </p>
 * <p>
 * Package-level default sequence generator (JPA 3.2): every {@code @GeneratedValue(strategy = SEQUENCE)}
 * without an explicit generator uses its entity's own {@code <entity>_seq} sequence with
 * {@code allocationSize = 1}, matching the {@code incrementBy="1"} of the Liquibase changesets.
 * </p>
 */
@SequenceGenerator(allocationSize = 1)
package org.myorganization.template.domain.entity;

import jakarta.persistence.SequenceGenerator;
