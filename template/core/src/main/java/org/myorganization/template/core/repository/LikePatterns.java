package org.myorganization.template.core.repository;

import java.util.Locale;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

/**
 * Builds {@code LIKE} predicates for user-supplied search text.
 * <p>
 * The wildcards {@code %} and {@code _} and the escape character itself are escaped, so
 * the input is matched literally (case-insensitive "contains") instead of being able to
 * widen the result set (SEC-19). The values are always bound as parameters; this is not
 * about SQL injection.
 */
public final class LikePatterns {

    /** Escape character declared in the generated {@code LIKE ... ESCAPE} clause. */
    public static final char ESCAPE_CHAR = '\\';

    private LikePatterns() {
    }

    /**
     * Escapes {@code \}, {@code %} and {@code _} so they are matched literally.
     *
     * @param value raw user input
     * @return the escaped value
     */
    public static String escape(String value) {
        StringBuilder sb = new StringBuilder(value.length() + 8);
        for (char c : value.toCharArray()) {
            if (c == ESCAPE_CHAR || c == '%' || c == '_') {
                sb.append(ESCAPE_CHAR);
            }
            sb.append(c);
        }
        return sb.toString();
    }

    /**
     * Case-insensitive "contains" predicate: {@code lower(expression) LIKE %value% ESCAPE '\'}.
     *
     * @param cb         criteria builder
     * @param expression string attribute to search
     * @param value      raw user input
     * @return the predicate
     */
    public static Predicate containsIgnoreCase(CriteriaBuilder cb, Expression<String> expression, String value) {
        String pattern = "%" + escape(value.toLowerCase(Locale.ROOT)) + "%";
        return cb.like(cb.lower(expression), pattern, ESCAPE_CHAR);
    }
}
