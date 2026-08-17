package org.myorganization.template.domain.dto;

/**
 * Lightweight reference DTO for Profile, used in dropdowns and selectors.
 *
 * @param id   profile identifier
 * @param name profile name
 */
public record ProfileRefDTO(Long id, String name) {
}
