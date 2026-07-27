package org.myorganization.template.domain.criteria;

/**
 * Filter criteria for User listings.
 *
 * @param username  filter by username (partial match)
 * @param firstName filter by first name (partial match)
 * @param lastName  filter by last name (partial match)
 * @param email     filter by email (partial match)
 * @param profileId filter by profile identifier
 */
public record UserCriteria(
        String username,
        String firstName,
        String lastName,
        String email,
        Long profileId
) {
}
