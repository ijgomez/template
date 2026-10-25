package org.myorganization.template.core.service;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ParameterRepository;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.entity.Parameter;
import org.myorganization.template.domain.enums.ParameterType;
import org.myorganization.template.domain.exception.ValidationException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Property-based test verifying parameter type-value validation in ParameterService.
 *
 * <p><b>Validates: Requirements 20.7, 28.5</b></p>
 *
 * <p>Property 9: For any parameter type and invalid value string, create returns
 * ValidationException (400); for valid value string, operation succeeds.</p>
 */
class ParameterServiceTypeValuePropertyTest {

    private final ParameterRepository parameterRepository = Mockito.mock(ParameterRepository.class);

    private final ParameterService parameterService = new ParameterService(parameterRepository);

    /**
     * For each ParameterType (excluding STRING), generate INVALID values and verify
     * that ParameterService.create() throws ValidationException.
     */
    @Property(tries = 100)
    void invalidTypeValuePairs_alwaysThrowValidationException(
            @ForAll("invalidTypeValueDTOs") ParameterDTO inputDto) {

        when(parameterRepository.existsByCode(anyString())).thenReturn(false);

        assertThatThrownBy(() -> parameterService.create(inputDto))
                .isInstanceOf(ValidationException.class);

        Mockito.reset(parameterRepository);
    }

    /**
     * For each ParameterType, generate VALID values and verify that
     * ParameterService.create() succeeds without throwing.
     */
    @Property(tries = 100)
    void validTypeValuePairs_alwaysSucceed(
            @ForAll("validTypeValueDTOs") ParameterDTO inputDto) {

        when(parameterRepository.existsByCode(anyString())).thenReturn(false);
        when(parameterRepository.save(any(Parameter.class))).thenAnswer(invocation -> {
            Parameter entity = invocation.getArgument(0);
            entity.setId(1L);
            return entity;
        });

        ParameterDTO result = parameterService.create(inputDto);

        assertThat(result).isNotNull();
        assertThat(result.value()).isEqualTo(inputDto.value());
        assertThat(result.type()).isEqualTo(inputDto.type());

        Mockito.reset(parameterRepository);
    }

    @Provide
    Arbitrary<ParameterDTO> invalidTypeValueDTOs() {
        Arbitrary<String> codes = Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(20)
                .map(String::toUpperCase);

        Arbitrary<String> descriptions = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);

        // Only INTEGER, BOOLEAN, DATE can have invalid values (STRING accepts anything)
        Arbitrary<ParameterType> types = Arbitraries.of(
                ParameterType.INTEGER, ParameterType.BOOLEAN, ParameterType.DATE);

        return types.flatMap(type -> {
            Arbitrary<String> invalidValues = generateInvalidValueForType(type);
            return Combinators.combine(codes, descriptions, invalidValues)
                    .as((code, description, value) ->
                            new ParameterDTO(null, code, description, value, type, null, null));
        });
    }

    @Provide
    Arbitrary<ParameterDTO> validTypeValueDTOs() {
        Arbitrary<String> codes = Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(20)
                .map(String::toUpperCase);

        Arbitrary<String> descriptions = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);

        Arbitrary<ParameterType> types = Arbitraries.of(ParameterType.class);

        return types.flatMap(type -> {
            Arbitrary<String> validValues = generateValidValueForType(type);
            return Combinators.combine(codes, descriptions, validValues)
                    .as((code, description, value) ->
                            new ParameterDTO(null, code, description, value, type, null, null));
        });
    }

    private Arbitrary<String> generateInvalidValueForType(ParameterType type) {
        return switch (type) {
            case INTEGER -> Arbitraries.oneOf(
                    // Alphabetic strings
                    Arbitraries.strings().alpha().ofMinLength(1).ofMaxLength(10),
                    // Decimal numbers (not valid integers)
                    Arbitraries.doubles().between(-999.0, 999.0)
                            .filter(d -> d != Math.floor(d))
                            .map(String::valueOf),
                    // Mixed alphanumeric
                    Arbitraries.integers().between(1, 99)
                            .map(i -> i + "a"),
                    // Empty and whitespace
                    Arbitraries.of("", " ", "  ")
            );
            case BOOLEAN -> Arbitraries.oneOf(
                    // Common non-boolean strings
                    Arbitraries.of("yes", "no", "1", "0", "maybe", "True", "False", "TRUE", "FALSE"),
                    // Random strings that are not "true" or "false"
                    Arbitraries.strings().alpha().ofMinLength(1).ofMaxLength(10)
                            .filter(s -> !"true".equals(s) && !"false".equals(s))
            );
            case DATE -> Arbitraries.oneOf(
                    // Non-date strings
                    Arbitraries.of("not-a-date", "abc", "12345", ""),
                    // Invalid month
                    Arbitraries.integers().between(2000, 2030)
                            .map(y -> String.format("%04d-13-01", y)),
                    // Invalid day
                    Arbitraries.integers().between(2000, 2030)
                            .map(y -> String.format("%04d-02-30", y)),
                    // Invalid format
                    Arbitraries.integers().between(1, 28)
                            .flatMap(d -> Arbitraries.integers().between(1, 12)
                                    .map(m -> String.format("%02d/%02d/2024", d, m)))
            );
            case STRING -> Arbitraries.just("unused"); // STRING accepts anything, won't be called
        };
    }

    private Arbitrary<String> generateValidValueForType(ParameterType type) {
        return switch (type) {
            case STRING -> Arbitraries.strings()
                    .ascii()
                    .ofMinLength(1)
                    .ofMaxLength(50);
            case INTEGER -> Arbitraries.integers()
                    .between(-999999, 999999)
                    .map(String::valueOf);
            case BOOLEAN -> Arbitraries.of("true", "false");
            case DATE -> Arbitraries.integers()
                    .between(2000, 2030)
                    .flatMap(year -> Arbitraries.integers().between(1, 12)
                            .flatMap(month -> Arbitraries.integers().between(1, 28)
                                    .map(day -> String.format("%04d-%02d-%02d", year, month, day))));
        };
    }
}
