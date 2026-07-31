package org.myorganization.template.core.service;

import java.util.Optional;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Property-based test verifying CRUD round-trip preserves entity data for Parameters.
 *
 * <p><b>Validates: Requirements 20.1, 20.3</b></p>
 *
 * <p>Property 1: For any valid parameter creation request, create then retrieve (findByCode)
 * should return equivalent fields (excluding system-generated fields like id, createdAt,
 * lastModifiedAt).</p>
 */
class ParameterServiceCrudRoundTripPropertyTest {

    private final ParameterRepository parameterRepository = Mockito.mock(ParameterRepository.class);

    private final ParameterService parameterService = new ParameterService(parameterRepository);

    @Property
    void crudRoundTripPreservesParameterData(@ForAll("validParameterDTOs") ParameterDTO inputDto) {
        // Arrange: configure mocks so create and findByCode succeed
        when(parameterRepository.existsByCode(anyString())).thenReturn(false);

        when(parameterRepository.save(any(Parameter.class))).thenAnswer(invocation -> {
            Parameter entity = invocation.getArgument(0);
            entity.setId(1L);
            return entity;
        });

        // Act: create parameter
        ParameterDTO created = parameterService.create(inputDto);

        // Arrange for findByCode: return a Parameter entity with the same data
        Parameter storedEntity = new Parameter();
        storedEntity.setId(1L);
        storedEntity.setCode(inputDto.code());
        storedEntity.setDescription(inputDto.description());
        storedEntity.setValue(inputDto.value());
        storedEntity.setType(inputDto.type());
        when(parameterRepository.findByCode(inputDto.code())).thenReturn(Optional.of(storedEntity));

        // Act: retrieve parameter by code
        ParameterDTO retrieved = parameterService.findByCode(inputDto.code());

        // Assert: non-system-generated fields match the input
        assertThat(retrieved.code()).isEqualTo(inputDto.code());
        assertThat(retrieved.description()).isEqualTo(inputDto.description());
        assertThat(retrieved.value()).isEqualTo(inputDto.value());
        assertThat(retrieved.type()).isEqualTo(inputDto.type());

        // Round-trip: created and retrieved should have consistent non-system fields
        assertThat(retrieved.code()).isEqualTo(created.code());
        assertThat(retrieved.description()).isEqualTo(created.description());
        assertThat(retrieved.value()).isEqualTo(created.value());
        assertThat(retrieved.type()).isEqualTo(created.type());

        // Reset mocks for next iteration
        Mockito.reset(parameterRepository);
    }

    @Provide
    Arbitrary<ParameterDTO> validParameterDTOs() {
        Arbitrary<String> codes = Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(30)
                .map(String::toUpperCase);

        Arbitrary<String> descriptions = Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);

        Arbitrary<ParameterType> types = Arbitraries.of(ParameterType.class);

        // Generate type-compatible values
        Arbitrary<ParameterDTO> dtos = types.flatMap(type -> {
            Arbitrary<String> values = generateValidValueForType(type);
            return Combinators.combine(codes, descriptions, values)
                    .as((code, description, value) ->
                            new ParameterDTO(null, code, description, value, type, null, null));
        });

        return dtos;
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
