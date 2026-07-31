package org.myorganization.template.webapp.serialization;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.TimeZone;
import java.util.regex.Pattern;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import net.jqwik.api.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for API date format compliance.
 * <p>
 * Verifies that Jackson serialization produces ISO 8601 timestamps with Z suffix
 * for all temporal fields in API responses.
 * <p>
 * Validates: Requirements 27.2
 */
class ApiDateFormatPropertyTest {

    private static final Pattern ISO_8601_Z_PATTERN =
            Pattern.compile("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,9})?Z$");

    private final ObjectMapper objectMapper;

    ApiDateFormatPropertyTest() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setTimeZone(TimeZone.getTimeZone("UTC"));
    }

    record TimestampDTO(OffsetDateTime createdAt, Instant updatedAt) {}

    /**
     * Property 14: OffsetDateTime serializes to ISO 8601 with Z suffix.
     * <p>
     * For any OffsetDateTime value in UTC (year 2000-2099), serialization produces
     * a string matching the ISO 8601 pattern with Z suffix.
     * <p>
     * <b>Validates: Requirements 27.2</b>
     */
    @Property(tries = 100)
    void offsetDateTimeSerializesToIso8601WithZ(
            @ForAll("utcOffsetDateTimes") OffsetDateTime dateTime) throws JsonProcessingException {

        TimestampDTO dto = new TimestampDTO(dateTime, dateTime.toInstant());
        String json = objectMapper.writeValueAsString(dto);

        // Extract the createdAt value from JSON
        String createdAtValue = extractJsonStringField(json, "createdAt");

        assertThat(createdAtValue)
                .as("OffsetDateTime should serialize to ISO 8601 with Z suffix")
                .matches(ISO_8601_Z_PATTERN.pattern());
    }

    /**
     * Property 14: Instant serializes to ISO 8601 with Z suffix.
     * <p>
     * For any Instant value, serialization produces a string matching
     * the ISO 8601 pattern with Z suffix.
     * <p>
     * <b>Validates: Requirements 27.2</b>
     */
    @Property(tries = 100)
    void instantSerializesToIso8601WithZ(
            @ForAll("instants") Instant instant) throws JsonProcessingException {

        TimestampDTO dto = new TimestampDTO(instant.atOffset(ZoneOffset.UTC), instant);
        String json = objectMapper.writeValueAsString(dto);

        // Extract the updatedAt value from JSON
        String updatedAtValue = extractJsonStringField(json, "updatedAt");

        assertThat(updatedAtValue)
                .as("Instant should serialize to ISO 8601 with Z suffix")
                .matches(ISO_8601_Z_PATTERN.pattern());
    }

    /**
     * Property 14: Round-trip serialization preserves Instant precision.
     * <p>
     * For any OffsetDateTime, serializing to JSON and deserializing back
     * preserves the epoch milliseconds.
     * <p>
     * <b>Validates: Requirements 27.2</b>
     */
    @Property(tries = 100)
    void roundTripPreservesInstant(
            @ForAll("utcOffsetDateTimes") OffsetDateTime dateTime) throws JsonProcessingException {

        TimestampDTO original = new TimestampDTO(dateTime, dateTime.toInstant());
        String json = objectMapper.writeValueAsString(original);
        TimestampDTO deserialized = objectMapper.readValue(json, TimestampDTO.class);

        assertThat(deserialized.createdAt().toInstant().toEpochMilli())
                .as("Round-trip should preserve epoch milliseconds for OffsetDateTime")
                .isEqualTo(original.createdAt().toInstant().toEpochMilli());

        assertThat(deserialized.updatedAt().toEpochMilli())
                .as("Round-trip should preserve epoch milliseconds for Instant")
                .isEqualTo(original.updatedAt().toEpochMilli());
    }

    // --- Arbitraries ---

    @Provide
    Arbitrary<OffsetDateTime> utcOffsetDateTimes() {
        return Combinators.combine(
                Arbitraries.integers().between(2000, 2099),  // year
                Arbitraries.integers().between(1, 12),       // month
                Arbitraries.integers().between(1, 28),       // day (safe for all months)
                Arbitraries.integers().between(0, 23),       // hour
                Arbitraries.integers().between(0, 59),       // minute
                Arbitraries.integers().between(0, 59),       // second
                Arbitraries.integers().between(0, 999)       // millis
        ).as((year, month, day, hour, minute, second, millis) ->
                OffsetDateTime.of(year, month, day, hour, minute, second, millis * 1_000_000, ZoneOffset.UTC)
        );
    }

    @Provide
    Arbitrary<Instant> instants() {
        return utcOffsetDateTimes().map(OffsetDateTime::toInstant);
    }

    // --- Helpers ---

    private String extractJsonStringField(String json, String fieldName) {
        // Simple extraction: find "fieldName":"value"
        String key = "\"" + fieldName + "\":\"";
        int startIdx = json.indexOf(key);
        if (startIdx < 0) {
            throw new IllegalStateException("Field '" + fieldName + "' not found in JSON: " + json);
        }
        startIdx += key.length();
        int endIdx = json.indexOf("\"", startIdx);
        return json.substring(startIdx, endIdx);
    }

}
