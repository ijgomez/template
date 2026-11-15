package org.myorganization.template.core.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for {@link SensitivePropertyMasker}.
 *
 * <p><b>Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.7, 4.8, 9.3</b></p>
 */
class SensitivePropertyMaskerPropertyTest {

    private static final List<String> SENSITIVE_FRAGMENTS =
            List.of("password", "passwd", "secret", "token", "key", "credential", "jwt");

    private static boolean containsSensitiveFragment(String key) {
        final String lower = key.toLowerCase(Locale.ROOT);
        return SENSITIVE_FRAGMENTS.stream().anyMatch(lower::contains);
    }

    // Feature: cluster-node-extended-info, Property 1: El enmascaramiento oculta solo las claves sensibles y conserva la estructura
    @Property(tries = 100)
    void maskHidesOnlySensitiveKeysAndPreservesStructure(@ForAll("properties") Map<String, String> input) {
        // given
        final Map<String, String> snapshot = new java.util.LinkedHashMap<>(input);

        // when
        final Map<String, String> masked = SensitivePropertyMasker.mask(input);

        // then
        assertThat(masked.keySet()).isEqualTo(input.keySet());
        assertThat(input).isEqualTo(snapshot);
        for (Map.Entry<String, String> entry : input.entrySet()) {
            if (containsSensitiveFragment(entry.getKey())) {
                assertThat(masked.get(entry.getKey())).isEqualTo(SensitivePropertyMasker.MASKED_VALUE);
            } else {
                assertThat(masked.get(entry.getKey())).isEqualTo(entry.getValue());
            }
        }
    }

    // Feature: cluster-node-extended-info, Property 2: El enmascaramiento es idempotente
    @Property(tries = 100)
    void maskIsIdempotent(@ForAll("properties") Map<String, String> input) {
        // when
        final Map<String, String> once = SensitivePropertyMasker.mask(input);
        final Map<String, String> twice = SensitivePropertyMasker.mask(once);

        // then
        assertThat(twice).isEqualTo(once);
    }

    @Provide
    Arbitrary<Map<String, String>> properties() {
        return Arbitraries.maps(keys(), values()).ofMinSize(0).ofMaxSize(15);
    }

    private Arbitrary<String> keys() {
        final Arbitrary<String> noise = Arbitraries.strings().alpha().numeric().withChars('.', '_', '-')
                .ofMinLength(0).ofMaxLength(8);
        final Arbitrary<String> fragment = Arbitraries.of(SENSITIVE_FRAGMENTS).flatMap(this::randomCase);
        final Arbitrary<String> withFragment =
                net.jqwik.api.Combinators.combine(noise, fragment, noise).as((a, f, b) -> a + f + b);
        final Arbitrary<String> plain = Arbitraries.strings().alpha().numeric().withChars('.', '_', '-')
                .ofMinLength(1).ofMaxLength(12);
        return Arbitraries.oneOf(withFragment, plain);
    }

    private Arbitrary<String> randomCase(String fragment) {
        return Arbitraries.of(true, false).list().ofSize(fragment.length()).map(flags -> {
            final StringBuilder sb = new StringBuilder();
            for (int i = 0; i < fragment.length(); i++) {
                final char c = fragment.charAt(i);
                sb.append(flags.get(i) ? Character.toUpperCase(c) : c);
            }
            return sb.toString();
        });
    }

    private Arbitrary<String> values() {
        return Arbitraries.oneOf(
                Arbitraries.just((String) null),
                Arbitraries.just(""),
                Arbitraries.strings().ofMinLength(0).ofMaxLength(30));
    }
}
