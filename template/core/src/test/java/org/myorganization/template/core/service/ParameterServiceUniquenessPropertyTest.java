package org.myorganization.template.core.service;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ParameterRepository;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.enums.ParameterType;
import org.myorganization.template.domain.exception.DuplicateEntityException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Property-based test for uniqueness constraint enforcement on Parameter creation.
 *
 * <p><b>Validates: Requirements 20.6</b></p>
 *
 * <p>Property 2: For any duplicate parameter code, attempting to create a parameter
 * with an already-existing code should always result in a DuplicateEntityException (409 Conflict).</p>
 */
class ParameterServiceUniquenessPropertyTest {

    @Property(tries = 100)
    void duplicateCode_alwaysThrowsDuplicateEntityException(
            @ForAll("validParameterCodes") String code) {

        // Arrange: fresh mocks per trial
        ParameterRepository parameterRepository = Mockito.mock(ParameterRepository.class);

        ParameterService parameterService = new ParameterService(parameterRepository);

        // Simulate that a parameter with this code already exists
        when(parameterRepository.existsByCode(code)).thenReturn(true);

        // Build a valid creation DTO with the duplicate code
        ParameterDTO dto = new ParameterDTO(
                null,               // id: null for creation
                code,               // duplicate code
                "Test description", // description
                "test_value",       // value
                ParameterType.STRING, // type
                null,               // createdAt
                null                // lastModifiedAt
        );

        // Act & Assert: creation must always throw DuplicateEntityException
        assertThatThrownBy(() -> parameterService.create(dto))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("code");

        // Verify the parameter was never persisted
        verify(parameterRepository, never()).save(Mockito.any());
    }

    @Provide
    Arbitrary<String> validParameterCodes() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .withChars('_')
                .ofMinLength(3)
                .ofMaxLength(50);
    }
}
