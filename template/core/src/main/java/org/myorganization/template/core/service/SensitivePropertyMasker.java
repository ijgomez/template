package org.myorganization.template.core.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Masks the values of sensitive properties (passwords, tokens, keys...) before they are persisted or exposed.
 * Stateless and pure: never modifies its input.
 */
public final class SensitivePropertyMasker {

    /** Value that replaces the original value of a sensitive property. */
    public static final String MASKED_VALUE = "******";

    private static final List<String> SENSITIVE_FRAGMENTS =
            List.of("password", "passwd", "secret", "token", "key", "credential", "jwt");

    private SensitivePropertyMasker() {
    }

    /**
     * Indicates whether a property key is sensitive (case-insensitive substring match).
     *
     * @param key property name; a null key is not sensitive
     * @return true if the key contains any sensitive fragment
     */
    public static boolean isSensitive(String key) {
        if (key == null) {
            return false;
        }
        final String lower = key.toLowerCase(Locale.ROOT);
        for (String fragment : SENSITIVE_FRAGMENTS) {
            if (lower.contains(fragment)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns a new map with the same keys where values of sensitive keys are replaced by {@link #MASKED_VALUE}
     * (including null or empty values). Other values are kept unchanged.
     *
     * @param properties source properties; not modified
     * @return new masked map (empty if the input is null)
     */
    public static Map<String, String> mask(Map<String, String> properties) {
        final Map<String, String> masked = new LinkedHashMap<>();
        if (properties == null) {
            return masked;
        }
        for (Map.Entry<String, String> entry : properties.entrySet()) {
            masked.put(entry.getKey(), isSensitive(entry.getKey()) ? MASKED_VALUE : entry.getValue());
        }
        return masked;
    }
}
