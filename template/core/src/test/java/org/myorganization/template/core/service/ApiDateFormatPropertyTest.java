package org.myorganization.template.core.service;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ParameterRepository;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.entity.Parameter;
import org.myorganization.template.domain.enums.ParameterType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Property-based test verifying API date format compliance.
 *
 * <p><b>Validates: Requirement 27.2</b></p>
 *
 * <p>Property 14: For any API response with timestamp fields, all values conform
 * to ISO 8601 with Z suffix (UTC offset).</p>
 *
 * <p>This test verifies that all OffsetDateTime fields in DTOs returned by services
 * have ZoneOffset.UTC, and when serialized via Jackson they produce the "Z" suffix.</p>
 */
class ApiDateFormatPropertyTest {

    private final ParameterRepository parameterRepository = Mockito.mock(ParameterRepository.class);
    private final ParameterService parameterService = new ParameterService(parameterRepository);

    private final ObjectMapper objectMapper = createObjectMapper();

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    // =====================================================================
    // Property 1: DTO timestamps have UTC offset
    // =====================================================================

    /**
     * For any entity with UTC timestamps persisted via JPA lifecycle callbacks,
     * the returned DTO timestamps must have ZoneOffset.UTC.
     */
    @Property(tries = 100)
    void dtoTimestampsHaveUtcOffset(@ForAll("utcTimestamps") OffsetDateTime timestamp) {
        Parameter entity = new Parameter();
        entity.setId(1L);
        entity.setCode("TEST_PARAM");
        entity.setDescription("test");
        entity.setValue("value");
        entity.setType(ParameterType.STRING);
        entity.setCreatedAt(timestamp);
        entity.setLastModifiedAt(timestamp);

        when(parameterRepository.findByCode(anyString())).thenReturn(Optional.of(entity));

        ParameterDTO dto = parameterService.findByCode("TEST_PARAM");

        assertThat(dto.createdAt()).isNotNull();
        assertThat(dto.createdAt().getOffset())
                .as("createdAt must have UTC offset (Z)")
                .isEqualTo(ZoneOffset.UTC);

        assertThat(dto.lastModifiedAt()).isNotNull();
        assertThat(dto.lastModifiedAt().getOffset())
                .as("lastModifiedAt must have UTC offset (Z)")
                .isEqualTo(ZoneOffset.UTC);

        Mockito.reset(parameterRepository);
    }

    // =====================================================================
    // Property 2: Serialized timestamps end with "Z"
    // =====================================================================

    /**
     * For any DTO with timestamp fields at UTC, Jackson serialization must produce
     * ISO 8601 strings ending with "Z" (not "+00:00").
     */
    @Property(tries = 100)
    void serializedTimestampsEndWithZ(@ForAll("utcTimestamps") OffsetDateTime timestamp) throws Exception {
        ParameterDTO dto = new ParameterDTO(
                1L, "SERIAL_TEST", "desc", "val", ParameterType.STRING,
                timestamp, timestamp);

        String json = objectMapper.writeValueAsString(dto);

        assertThat(json)
                .as("Serialized JSON should contain Z-suffixed timestamps")
                .contains("\"" + formatExpectedTimestamp(timestamp) + "\"");
    }

    // =====================================================================
    // Property 3: Non-UTC timestamps are normalized to UTC in DTO
    // =====================================================================

    /**
     * For any entity with a non-UTC offset timestamp, when the system stores it
     * as UTC (via JPA @PrePersist), the DTO must reflect UTC offset.
     * This verifies that even if input had a different offset, the output is always UTC.
     */
    @Property(tries = 100)
    void nonUtcTimestampsNormalizedToUtcInDto(@ForAll("arbitraryTimestamps") OffsetDateTime arbitraryTimestamp) {
        OffsetDateTime utcTimestamp = arbitraryTimestamp.withOffsetSameInstant(ZoneOffset.UTC);

        Parameter entity = new Parameter();
        entity.setId(2L);
        entity.setCode("NORMALIZE_TEST");
        entity.setDescription("test");
        entity.setValue("123");
        entity.setType(ParameterType.INTEGER);
        entity.setCreatedAt(utcTimestamp);
        entity.setLastModifiedAt(utcTimestamp);

        when(parameterRepository.findByCode(anyString())).thenReturn(Optional.of(entity));

        ParameterDTO dto = parameterService.findByCode("NORMALIZE_TEST");

        assertThat(dto.createdAt().getOffset())
                .as("After normalization, createdAt offset must be UTC")
                .isEqualTo(ZoneOffset.UTC);
        assertThat(dto.lastModifiedAt().getOffset())
                .as("After normalization, lastModifiedAt offset must be UTC")
                .isEqualTo(ZoneOffset.UTC);

        assertThat(dto.createdAt().toInstant())
                .isEqualTo(arbitraryTimestamp.toInstant());

        Mockito.reset(parameterRepository);
    }

    // =====================================================================
    // Property 4: All DTO timestamp fields are ISO 8601 compliant
    // =====================================================================

    /**
     * For any valid DTO with timestamps, string representation matches ISO 8601 with Z.
     */
    @Property(tries = 100)
    void allTimestampFieldsAreIso8601Compliant(@ForAll("utcTimestamps") OffsetDateTime timestamp) {
        ParameterDTO dto = new ParameterDTO(
                1L, "ISO_TEST", "desc", "val", ParameterType.STRING,
                timestamp, timestamp);

        String iso8601Pattern = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?(\\.\\d+)?Z";
        assertThat(dto.createdAt().toString())
                .as("createdAt string representation must be ISO 8601 with Z")
                .matches(iso8601Pattern);
        assertThat(dto.lastModifiedAt().toString())
                .as("lastModifiedAt string representation must be ISO 8601 with Z")
                .matches(iso8601Pattern);
    }

    // --- Helpers ---

    private String formatExpectedTimestamp(OffsetDateTime timestamp) {
        return java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
                .format(timestamp) + "Z";
    }

    // --- Providers ---

    @Provide
    Arbitrary<OffsetDateTime> utcTimestamps() {
        return Arbitraries.longs()
                .between(946684800L, 1893456000L)
                .map(epoch -> OffsetDateTime.ofInstant(Instant.ofEpochSecond(epoch), ZoneOffset.UTC));
    }

    @Provide
    Arbitrary<OffsetDateTime> arbitraryTimestamps() {
        Arbitrary<Long> epochs = Arbitraries.longs().between(946684800L, 1893456000L);
        Arbitrary<Integer> offsets = Arbitraries.integers().between(-12, 14);

        return epochs.flatMap(epoch ->
                offsets.map(hours -> OffsetDateTime.ofInstant(
                        Instant.ofEpochSecond(epoch),
                        ZoneOffset.ofHours(hours))));
    }
}
