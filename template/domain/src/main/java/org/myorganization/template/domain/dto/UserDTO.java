package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Data Transfer Object for User entity.
 *
 * @param id              user identifier ({@code null} for creation)
 * @param username        login username
 * @param password        user password
 * @param firstName       first name
 * @param lastName        last name
 * @param email           email address
 * @param lastAccess      timestamp of last access
 * @param profileId       associated profile identifier
 * @param profileName     associated profile name
 * @param reportIds       list of associated report identifiers
 * @param createdAt       creation timestamp
 * @param lastModifiedAt  last modification timestamp
 */
public record UserDTO(
        Long id,
        String username,
        String password,
        String firstName,
        String lastName,
        String email,
        OffsetDateTime lastAccess,
        Long profileId,
        String profileName,
        List<Long> reportIds,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
