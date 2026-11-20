package org.myorganization.template.core.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Masks the values of sensitive properties (passwords, tokens, keys...) before they are persisted or exposed.
 * Stateless and pure: never modifies its input.
 */
public final class SensitivePropertyMasker {

    /** Value that replaces the original value of a sensitive property. */
    public static final String MASKED_VALUE = "******";

    private static final List<String> SENSITIVE_FRAGMENTS = List.of(
            "password", "passwd", "pass", "pwd", "secret", "token", "key", "credential", "jwt",
            "auth", "cookie", "private", "dsn", "salt");

    /** {@code scheme://user:password@host}: the password part of a URL user-info. */
    private static final Pattern URL_USER_INFO =
            Pattern.compile("([a-zA-Z][a-zA-Z0-9+.\\-]{0,31}://[^/\\s:@]{1,256}):[^/\\s@]{1,256}@");

    /**
     * Inline {@code name=value} pairs (JVM options such as {@code -Dpassword=x}, query strings,
     * connection strings) whose name contains a sensitive fragment.
     */
    private static final Pattern SENSITIVE_ASSIGNMENT = Pattern.compile(
            "((?:^|[\\s,;&?])(?:-D|--)?[\\w.\\-]{0,100}?(?:" + String.join("|", SENSITIVE_FRAGMENTS)
                    + ")[\\w.\\-]{0,100}=)[^\\s,;&]+",
            Pattern.CASE_INSENSITIVE);

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
     * Redacts secrets embedded in the value of a property whose own name is not sensitive:
     * the password of a URL user-info and the value of inline sensitive {@code name=value} pairs.
     *
     * @param value property value; may be null
     * @return the value with embedded secrets replaced by {@link #MASKED_VALUE}
     */
    static String redactEmbeddedSecrets(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        // Cheap guards first: values can be very large (up to the node properties size limit) and
        // every pattern below needs one of these markers. All quantifiers are bounded to keep the
        // matching linear on long inputs.
        String redacted = value;
        if (redacted.contains("://")) {
            redacted = URL_USER_INFO.matcher(redacted)
                    .replaceAll(match -> Matcher.quoteReplacement(match.group(1) + ":" + MASKED_VALUE + "@"));
        }
        if (redacted.indexOf('=') >= 0) {
            redacted = SENSITIVE_ASSIGNMENT.matcher(redacted)
                    .replaceAll(match -> Matcher.quoteReplacement(match.group(1) + MASKED_VALUE));
        }
        return redacted;
    }

    /**
     * Returns a new map with the same keys where values of sensitive keys are replaced by {@link #MASKED_VALUE}
     * (including null or empty values). In the other values, embedded secrets (URL passwords and inline
     * sensitive {@code name=value} pairs) are redacted; the rest is kept unchanged.
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
            masked.put(entry.getKey(), isSensitive(entry.getKey()) ? MASKED_VALUE : redactEmbeddedSecrets(entry.getValue()));
        }
        return masked;
    }
}
