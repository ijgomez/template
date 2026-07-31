package org.myorganization.template.core.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property-based test: Duplicate list item detection for Users.
 *
 * <p><b>Validates: Requirements 4.8</b></p>
 *
 * <p>Property 3: For any user creation/update with duplicate reports in list,
 * the operation should always result in a 400 Bad Request (ValidationException).</p>
 */
@ExtendWith(MockitoExtension.class)
class UserServiceDuplicateReportsPropertyTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private User2ReportRepository user2ReportRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    /**
     * Generates a list of report IDs that always contains at least one duplicate.
     * Strategy: generate a base list of 1-20 IDs, then pick one at random and insert it again.
     */
    @Provide
    Arbitrary<List<Long>> reportIdsWithDuplicates() {
        return Arbitraries.longs().between(1L, 1000L)
                .list().ofMinSize(1).ofMaxSize(20)
                .flatMap(baseList -> Arbitraries.integers().between(0, baseList.size() - 1)
                        .map(duplicateIndex -> {
                            List<Long> result = new ArrayList<>(baseList);
                            // Insert a duplicate of the element at duplicateIndex
                            result.add(baseList.get(duplicateIndex));
                            // Shuffle to avoid the duplicate always being at the end
                            Collections.shuffle(result);
                            return result;
                        }));
    }

    @Property(tries = 100)
    void create_withDuplicateReports_alwaysThrowsValidationException(
            @ForAll("reportIdsWithDuplicates") List<Long> duplicateReportIds) {

        UserService userService = new UserService(userRepository, profileRepository,
                reportRepository, user2ReportRepository, passwordEncoder);

        UserDTO dto = new UserDTO(null, "testuser", "password", "First", "Last",
                "test@example.com", null, null, null, duplicateReportIds, null, null);

        assertThatThrownBy(() -> userService.create(dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");
    }

    @Property(tries = 100)
    void update_withDuplicateReports_alwaysThrowsValidationException(
            @ForAll("reportIdsWithDuplicates") List<Long> duplicateReportIds) {

        UserService userService = new UserService(userRepository, profileRepository,
                reportRepository, user2ReportRepository, passwordEncoder);

        UserDTO dto = new UserDTO(1L, "testuser", null, "First", "Last",
                "test@example.com", null, null, null, duplicateReportIds, null, null);

        assertThatThrownBy(() -> userService.update(1L, dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("duplicates");
    }
}
