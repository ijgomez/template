package org.myorganization.template.core.service;

import java.util.Collections;
import java.util.List;
import java.util.stream.IntStream;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ProfileRepository;
import org.myorganization.template.core.repository.ReportRepository;
import org.myorganization.template.core.repository.User2ReportRepository;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.criteria.UserCriteria;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Property-based test verifying pagination metadata consistency via UserService.findByCriteria.
 *
 * <p><b>Validates: Requirements 25.1, 4.2, 14.2, 20.2</b></p>
 *
 * <p>Property 12: For any valid page size and number, totalPages = ceil(totalElements / size),
 * content.size() &le; size, and if page &lt; totalPages then content is non-empty.</p>
 *
 * <p>This test uses UserService.findByCriteria as the test subject, mocking the repository
 * to return pages with various sizes and verifying the Page metadata through the service layer.</p>
 */
class PaginationMetadataConsistencyPropertyTest {

    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
    private final ReportRepository reportRepository = Mockito.mock(ReportRepository.class);
    private final User2ReportRepository user2ReportRepository = Mockito.mock(User2ReportRepository.class);
    private final PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);

    private final UserService userService = new UserService(
            userRepository, profileRepository, reportRepository,
            user2ReportRepository, passwordEncoder);

    /**
     * Property: totalPages == Math.ceil(totalElements / size) for any pagination scenario.
     */
    @Property(tries = 200)
    void totalPagesConsistencyThroughService(@ForAll("paginationScenarios") PaginationScenario scenario) {
        configureMock(scenario);

        Page<UserDTO> result = userService.findByCriteria(
                new UserCriteria(null, null, null, null, null),
                PageRequest.of(scenario.pageNumber(), scenario.pageSize()));

        int expectedTotalPages = (int) Math.ceil((double) scenario.totalElements() / scenario.pageSize());
        assertThat(result.getTotalPages())
                .as("totalPages for totalElements=%d, pageSize=%d",
                        scenario.totalElements(), scenario.pageSize())
                .isEqualTo(expectedTotalPages);

        Mockito.reset(userRepository);
    }

    /**
     * Property: content size never exceeds page size.
     */
    @Property(tries = 200)
    void contentSizeNeverExceedsPageSizeThroughService(@ForAll("paginationScenarios") PaginationScenario scenario) {
        configureMock(scenario);

        Page<UserDTO> result = userService.findByCriteria(
                new UserCriteria(null, null, null, null, null),
                PageRequest.of(scenario.pageNumber(), scenario.pageSize()));

        assertThat(result.getContent().size())
                .as("content.size() should not exceed pageSize=%d", scenario.pageSize())
                .isLessThanOrEqualTo(scenario.pageSize());

        Mockito.reset(userRepository);
    }

    /**
     * Property: if page < totalPages and totalElements > 0, then content is non-empty.
     */
    @Property(tries = 200)
    void nonLastPageIsNonEmptyThroughService(@ForAll("nonLastPageScenarios") PaginationScenario scenario) {
        configureMock(scenario);

        Page<UserDTO> result = userService.findByCriteria(
                new UserCriteria(null, null, null, null, null),
                PageRequest.of(scenario.pageNumber(), scenario.pageSize()));

        assertThat(result.getContent())
                .as("Page %d should be non-empty (totalElements=%d, pageSize=%d, totalPages=%d)",
                        scenario.pageNumber(), scenario.totalElements(), scenario.pageSize(),
                        result.getTotalPages())
                .isNotEmpty();

        Mockito.reset(userRepository);
    }

    /**
     * Property: totalElements reported by the Page matches the repository count.
     */
    @Property(tries = 200)
    void totalElementsIsPreservedThroughService(@ForAll("paginationScenarios") PaginationScenario scenario) {
        configureMock(scenario);

        Page<UserDTO> result = userService.findByCriteria(
                new UserCriteria(null, null, null, null, null),
                PageRequest.of(scenario.pageNumber(), scenario.pageSize()));

        assertThat(result.getTotalElements())
                .as("totalElements should match repository total")
                .isEqualTo(scenario.totalElements());

        Mockito.reset(userRepository);
    }

    // --- Helpers ---

    @SuppressWarnings("unchecked")
    private void configureMock(PaginationScenario scenario) {
        int totalPages = (int) Math.ceil((double) scenario.totalElements() / scenario.pageSize());
        int contentSize;
        if (scenario.totalElements() == 0) {
            contentSize = 0;
        } else if (scenario.pageNumber() < totalPages - 1) {
            contentSize = scenario.pageSize();
        } else {
            int remainder = scenario.totalElements() % scenario.pageSize();
            contentSize = (remainder == 0) ? scenario.pageSize() : remainder;
        }

        List<User> users = IntStream.range(0, contentSize)
                .mapToObj(i -> {
                    User u = new User();
                    u.setId((long) (i + 1));
                    u.setUsername("user" + i);
                    u.setFirstName("First" + i);
                    u.setLastName("Last" + i);
                    u.setEmail("user" + i + "@test.com");
                    u.setUserReports(Collections.emptyList());
                    return u;
                })
                .toList();

        Pageable pageable = PageRequest.of(scenario.pageNumber(), scenario.pageSize());
        Page<User> mockPage = new PageImpl<>(users, pageable, scenario.totalElements());

        when(userRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);
    }

    // --- Providers ---

    @Provide
    Arbitrary<PaginationScenario> paginationScenarios() {
        Arbitrary<Integer> totalElements = Arbitraries.integers().between(0, 5000);
        Arbitrary<Integer> pageSize = Arbitraries.integers().between(1, 100);

        return Combinators.combine(totalElements, pageSize).flatAs((total, size) -> {
            int maxPage = Math.max(0, (int) Math.ceil((double) total / size) - 1);
            Arbitrary<Integer> pageNumber = Arbitraries.integers().between(0, maxPage);
            return pageNumber.map(pn -> new PaginationScenario(total, size, pn));
        });
    }

    @Provide
    Arbitrary<PaginationScenario> nonLastPageScenarios() {
        Arbitrary<Integer> pageSize = Arbitraries.integers().between(1, 100);

        return pageSize.flatMap(size -> {
            Arbitrary<Integer> totalElements = Arbitraries.integers().between(size + 1, 5000);
            return totalElements.flatMap(total -> {
                int totalPages = (int) Math.ceil((double) total / size);
                int maxNonLastPage = Math.max(0, totalPages - 2);
                Arbitrary<Integer> pageNumber = Arbitraries.integers().between(0, maxNonLastPage);
                return pageNumber.map(pn -> new PaginationScenario(total, size, pn));
            });
        });
    }

    record PaginationScenario(int totalElements, int pageSize, int pageNumber) {
    }
}
