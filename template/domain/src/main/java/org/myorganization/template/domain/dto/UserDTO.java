package org.myorganization.template.domain.dto;

import java.time.OffsetDateTime;
import java.util.List;

import org.myorganization.template.domain.validation.ValidationGroups;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object for User entity.
 *
 * @param id              user identifier ({@code null} for creation)
 * @param username        login username (required when creating)
 * @param password        user password (required when creating)
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
        @NotBlank(groups = ValidationGroups.Create.class, message = "username is required")
        @Size(max = 100, message = "username must not exceed 100 characters")
        String username,
        @NotBlank(groups = ValidationGroups.Create.class, message = "password is required")
        @Size(max = 255, message = "password must not exceed 255 characters")
        String password,
        @Size(max = 100, message = "firstName must not exceed 100 characters")
        String firstName,
        @Size(max = 100, message = "lastName must not exceed 100 characters")
        String lastName,
        @Email(message = "email must be a well-formed email address")
        @Size(max = 255, message = "email must not exceed 255 characters")
        String email,
        OffsetDateTime lastAccess,
        Long profileId,
        String profileName,
        List<Long> reportIds,
        OffsetDateTime createdAt,
        OffsetDateTime lastModifiedAt
) {
}
