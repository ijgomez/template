package org.myorganization.template.domain.criteria;

import org.myorganization.template.domain.enums.InterfaceStatus;

/**
 * Filter criteria for Interface (configuration) listings.
 *
 * @param name     partial, case-insensitive match on the interface name
 * @param protocol partial, case-insensitive match on the protocol
 * @param status   exact match on the interface status
 */
public record InterfaceCriteria(
        String name,
        String protocol,
        InterfaceStatus status
) {
}
