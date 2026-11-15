package org.myorganization.template.core.service;

import java.util.Map;
import java.util.Optional;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.constraints.IntRange;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for {@link NodePropertiesJsonCodec}.
 *
 * <p><b>Validates: Requirements 3.1, 3.5, 3.7, 3.8</b></p>
 */
class NodePropertiesJsonCodecPropertyTest {

    /** Length of {@code {"k":"} + {"}} around the value, for a single entry with key "k". */
    private static final int JSON_OVERHEAD = 8;

    @Provide
    Arbitrary<String> texts() {
        return Arbitraries.strings()
                .withCharRange(' ', '~')
                .withChars('á', 'é', 'ñ', 'ü', '€', '\n', '\t')
                .ofMaxLength(40);
    }

    @Provide
    Arbitrary<Map<String, String>> propertyMaps() {
        Arbitrary<String> values = texts().injectNull(0.1);
        return Arbitraries.maps(texts(), values).ofMaxSize(20);
    }

    @Provide
    Arbitrary<String> arbitraryInputs() {
        Arbitrary<String> fixed = Arbitraries.of(
                "", " ", "null", "[]", "[\"a\"]", "123", "\"text\"", "true",
                "{", "}", "{\"a\":", "{\"a\":1}", "{\"a\":{\"b\":\"c\"}}",
                "{\"a\":[\"x\"]}", "{\"a\":\"b\"}", "{}");
        return Arbitraries.oneOf(
                Arbitraries.strings().ofMaxLength(200),
                fixed,
                Arbitraries.just((String) null));
    }

    // Feature: cluster-node-extended-info, Property 3: JSON round trip of the properties
    @Property(tries = 100)
    void fromJsonOfToJsonReturnsOriginalMap(@ForAll("propertyMaps") Map<String, String> map) {
        // when
        Optional<String> json = NodePropertiesJsonCodec.toJson(map);
        Map<String, String> result = NodePropertiesJsonCodec.fromJson(json.orElse(null));

        // then
        assertThat(json).isPresent();
        assertThat(json.get().length()).isLessThanOrEqualTo(NodePropertiesJsonCodec.MAX_JSON_LENGTH);
        assertThat(result).isEqualTo(map);
    }

    // Feature: cluster-node-extended-info, Property 4: JSON reading is tolerant to any string
    @Property(tries = 100)
    void fromJsonNeverThrowsAndReturnsMap(@ForAll("arbitraryInputs") String input) {
        // when
        Map<String, String> result = NodePropertiesJsonCodec.fromJson(input);

        // then
        assertThat(result).isNotNull();
        if (input == null || input.isBlank()) {
            assertThat(result).isEmpty();
        }
    }

    // Feature: cluster-node-extended-info, Property 5: JSON size limit
    @Property(tries = 100)
    void toJsonIsPresentIffLengthWithinLimit(
            @ForAll @IntRange(min = -60, max = 60) int offset,
            @ForAll @IntRange(min = 0, max = 20) int quotes) {
        // given: value of valueLength chars, 'quotes' of them are escaped (+1 char each in JSON)
        int valueLength = NodePropertiesJsonCodec.MAX_JSON_LENGTH - JSON_OVERHEAD - quotes + offset;
        String value = "\"".repeat(quotes) + "a".repeat(valueLength - quotes);
        long expectedLength = (long) valueLength + quotes + JSON_OVERHEAD;

        // when
        Optional<String> json = NodePropertiesJsonCodec.toJson(Map.of("k", value));

        // then
        assertThat(json.isPresent()).isEqualTo(expectedLength <= NodePropertiesJsonCodec.MAX_JSON_LENGTH);
        json.ifPresent(j -> assertThat(j).hasSize((int) expectedLength));
    }
}
