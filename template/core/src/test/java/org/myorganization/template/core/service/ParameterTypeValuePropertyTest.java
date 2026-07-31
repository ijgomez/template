package org.myorganization.template.core.service;

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
import org.myorganization.template.domain.exception.ValidationException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Property-based test for parameter type-value validation.
 *
 * <p><b>Validates: Requirements 20.7, 28.5</b></p>
 *
 * <p>Property 9: For any parameter type and invalid value string,
 * create/update returns 400; for valid value string, operation succeeds.</p>
 */
class ParameterTypeValuePropertyTest {

    private final ParameterRepository parameterRepository = Mockito.mock(ParameterRepository.class);
    private final ParameterService parameterService = new ParameterService(parameterRepository);

    @Property(tries = 100)
    void integerTypeRejectsNonIntegerValues(@ForAll("invalidIntegerValues") String invalidValue) {
        ParameterDTO dto = new ParameterDTO(null, "TEST_INT", "desc", invalidValue, ParameterType.INTEGER, null, null);
        when(parameterRepository.existsByCode(anyString())).thenReturn(false);

        assertThatThrownBy(() -> parameterService.create(dto))
                .isInstanceOf(ValidationException.class);

        Mockito.reset(parameterRepository);
    }

    @Property(tries = 100)
    void integerTypeAcceptsValidIntegerValues(@ForAll("validIntegerValues") String validValue) {
        ParameterDTO dto = new ParameterDTO(null, "TEST_INT_OK", "desc", validValue, ParameterType.INTEGER, null, null);
        when(parameterRepository.existsByCode(anyString())).thenReturn(false);
        when(parameterRepository.save(any(Parameter.class))).thenAnswer(inv -> {
            Parameter p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        ParameterDTO result = parameterService.create(dto);
        assertThat(result).isNotNull();
        Mockito.reset(parameterRepository);
    }

    @Property(tries = 100)
    void booleanTypeRejectsNonBooleanValues(@ForAll("invalidBooleanValues") String invalidValue) {
        ParameterDTO dto = new ParameterDTO(null, "TEST_BOOL", "desc", invalidValue, ParameterType.BOOLEAN, null, null);
        when(parameterRepository.existsByCode(anyString())).thenReturn(false);

        assertThatThrownBy(() -> parameterService.create(dto))
                .isInstanceOf(ValidationException.class);

        Mockito.reset(parameterRepository);
    }

    @Property(tries = 10)
    void booleanTypeAcceptsOnlyTrueOrFalse(@ForAll("validBooleanValues") String validValue) {
        ParameterDTO dto = new ParameterDTO(null, "TEST_BOOL_OK", "desc", validValue, ParameterType.BOOLEAN, null, null);
        when(parameterRepository.existsByCode(anyString())).thenReturn(false);
        when(parameterRepository.save(any(Parameter.class))).thenAnswer(inv -> {
            Parameter p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        ParameterDTO result = parameterService.create(dto);
        assertThat(result).isNotNull();
        Mockito.reset(parameterRepository);
    }

    @Property(tries = 100)
    void dateTypeRejectsInvalidDateValues(@ForAll("invalidDateValues") String invalidValue) {
        ParameterDTO dto = new ParameterDTO(null, "TEST_DATE", "desc", invalidValue, ParameterType.DATE, null, null);
        when(parameterRepository.existsByCode(anyString())).thenReturn(false);

        assertThatThrownBy(() -> parameterService.create(dto))
                .isInstanceOf(ValidationException.class);

        Mockito.reset(parameterRepository);
    }

    @Property(tries = 100)
    void stringTypeAcceptsAnyValue(@ForAll("anyStringValues") String anyValue) {
        ParameterDTO dto = new ParameterDTO(null, "TEST_STR", "desc", anyValue, ParameterType.STRING, null, null);
        when(parameterRepository.existsByCode(anyString())).thenReturn(false);
        when(parameterRepository.save(any(Parameter.class))).thenAnswer(inv -> {
            Parameter p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        ParameterDTO result = parameterService.create(dto);
        assertThat(result).isNotNull();
        Mockito.reset(parameterRepository);
    }

    @Provide
    Arbitrary<String> invalidIntegerValues() {
        return Arbitraries.of("abc", "12.5", "1e10", "true", "", " ", "12a", "1,000", "NaN", "Infinity");
    }

    @Provide
    Arbitrary<String> validIntegerValues() {
        return Arbitraries.integers().between(-999999, 999999).map(String::valueOf);
    }

    @Provide
    Arbitrary<String> invalidBooleanValues() {
        return Arbitraries.of("True", "False", "TRUE", "FALSE", "yes", "no", "1", "0", "on", "off", "");
    }

    @Provide
    Arbitrary<String> validBooleanValues() {
        return Arbitraries.of("true", "false");
    }

    @Provide
    Arbitrary<String> invalidDateValues() {
        return Arbitraries.of("not-a-date", "2024/01/15", "15-01-2024", "abc123", "2024-13-01", "2024-02-30", "");
    }

    @Provide
    Arbitrary<String> anyStringValues() {
        return Arbitraries.strings().ascii().ofMinLength(0).ofMaxLength(200);
    }
}
