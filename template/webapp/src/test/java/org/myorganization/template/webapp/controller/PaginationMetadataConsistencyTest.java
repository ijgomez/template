package org.myorganization.template.webapp.controller;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.service.ActionService;
import org.myorganization.template.core.service.ClusterService;
import org.myorganization.template.core.service.ParameterService;
import org.myorganization.template.core.service.ProfileService;
import org.myorganization.template.core.service.UserService;
import org.myorganization.template.domain.criteria.ActionCriteria;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.criteria.ParameterCriteria;
import org.myorganization.template.domain.criteria.ProfileCriteria;
import org.myorganization.template.domain.criteria.UserCriteria;
import org.myorganization.template.domain.dto.ActionDTO;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.dto.ParameterDTO;
import org.myorganization.template.domain.dto.ProfileDTO;
import org.myorganization.template.domain.dto.UserDTO;
import org.myorganization.template.domain.enums.ActionType;
import org.myorganization.template.domain.enums.ParameterType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies that all paginated endpoints return consistent pagination metadata.
 * <p>
 * For any paginated response, the following invariants must hold:
 * <ul>
 *   <li>{@code totalPages = ceil(totalElements / size)}</li>
 *   <li>{@code content.size() <= size}</li>
 *   <li>If {@code page < totalPages}, then content is non-empty</li>
 * </ul>
 * <p>
 * This ensures compliance with Requirements 25.1 and 25.13.
 */
@DisplayName("Pagination metadata consistency across all controllers")
class PaginationMetadataConsistencyTest {

    // =====================================================================
    // Helper methods
    // =====================================================================

    /**
     * Asserts the pagination metadata invariants on the given Page response.
     */
    private <T> void assertPaginationMetadata(Page<T> page, int requestedSize) {
        long totalElements = page.getTotalElements();
        int totalPages = page.getTotalPages();
        int contentSize = page.getContent().size();
        int pageNumber = page.getNumber();

        // totalPages = ceil(totalElements / size)
        int expectedTotalPages = (int) Math.ceil((double) totalElements / requestedSize);
        assertThat(totalPages)
                .as("totalPages should be ceil(totalElements / size): ceil(%d / %d) = %d",
                        totalElements, requestedSize, expectedTotalPages)
                .isEqualTo(expectedTotalPages);

        // content.size() <= size
        assertThat(contentSize)
                .as("content length should be <= page size (%d)", requestedSize)
                .isLessThanOrEqualTo(requestedSize);

        // page size in metadata matches requested size
        assertThat(page.getSize())
                .as("page size in metadata should match requested size")
                .isEqualTo(requestedSize);

        // If page < totalPages, content should be non-empty
        if (pageNumber < totalPages) {
            assertThat(contentSize)
                    .as("content should be non-empty when page (%d) < totalPages (%d)",
                            pageNumber, totalPages)
                    .isGreaterThan(0);
        }
    }

    // =====================================================================
    // UserController pagination tests
    // =====================================================================

    @Nested
    @DisplayName("UserController pagination")
    class UserControllerPagination {

        private UserService userService;
        private UserController userController;

        @BeforeEach
        void setUp() {
            userService = mock(UserService.class);
            userController = new UserController(userService);
        }

        @Test
        @DisplayName("Full page: 10 elements with size 10 returns correct metadata")
        void fullPage_shouldHaveConsistentMetadata() {
            int size = 10;
            Pageable pageable = PageRequest.of(0, size);
            List<UserDTO> users = createUsers(10);
            Page<UserDTO> page = new PageImpl<>(users, pageable, 10);
            when(userService.findByCriteria(any(UserCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<UserDTO>> response = userController.findAll(null, null, null, null, null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
        }

        @Test
        @DisplayName("Partial last page: 25 elements with size 10 returns correct metadata on page 2")
        void partialLastPage_shouldHaveConsistentMetadata() {
            int size = 10;
            Pageable pageable = PageRequest.of(2, size);
            List<UserDTO> lastPageContent = createUsers(5);
            Page<UserDTO> page = new PageImpl<>(lastPageContent, pageable, 25);
            when(userService.findByCriteria(any(UserCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<UserDTO>> response = userController.findAll(null, null, null, null, null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(3);
            assertThat(response.getBody().getContent()).hasSize(5);
        }

        @Test
        @DisplayName("Empty result: 0 elements returns correct metadata")
        void emptyResult_shouldHaveConsistentMetadata() {
            int size = 10;
            Pageable pageable = PageRequest.of(0, size);
            Page<UserDTO> page = new PageImpl<>(List.of(), pageable, 0);
            when(userService.findByCriteria(any(UserCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<UserDTO>> response = userController.findAll(null, null, null, null, null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(0);
            assertThat(response.getBody().getTotalElements()).isEqualTo(0);
        }

        @Test
        @DisplayName("Single element with size 5 returns correct metadata")
        void singleElement_shouldHaveConsistentMetadata() {
            int size = 5;
            Pageable pageable = PageRequest.of(0, size);
            List<UserDTO> users = createUsers(1);
            Page<UserDTO> page = new PageImpl<>(users, pageable, 1);
            when(userService.findByCriteria(any(UserCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<UserDTO>> response = userController.findAll(null, null, null, null, null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(1);
        }

        private List<UserDTO> createUsers(int count) {
            List<UserDTO> users = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                users.add(new UserDTO((long) (i + 1), "user" + i, null, "First" + i, "Last" + i,
                        "user" + i + "@mail.com", null, 1L, "Admin", List.of(), OffsetDateTime.now(), OffsetDateTime.now()));
            }
            return users;
        }
    }

    // =====================================================================
    // ProfileController pagination tests
    // =====================================================================

    @Nested
    @DisplayName("ProfileController pagination")
    class ProfileControllerPagination {

        private ProfileService profileService;
        private ProfileController profileController;

        @BeforeEach
        void setUp() {
            profileService = mock(ProfileService.class);
            profileController = new ProfileController(profileService);
        }

        @Test
        @DisplayName("Full page returns consistent metadata")
        void fullPage_shouldHaveConsistentMetadata() {
            int size = 5;
            Pageable pageable = PageRequest.of(0, size);
            List<ProfileDTO> profiles = createProfiles(5);
            Page<ProfileDTO> page = new PageImpl<>(profiles, pageable, 12);
            when(profileService.findByCriteria(any(ProfileCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<ProfileDTO>> response = profileController.findAll(null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(3);
        }

        @Test
        @DisplayName("Empty result returns consistent metadata")
        void emptyResult_shouldHaveConsistentMetadata() {
            int size = 10;
            Pageable pageable = PageRequest.of(0, size);
            Page<ProfileDTO> page = new PageImpl<>(List.of(), pageable, 0);
            when(profileService.findByCriteria(any(ProfileCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<ProfileDTO>> response = profileController.findAll(null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
        }

        private List<ProfileDTO> createProfiles(int count) {
            List<ProfileDTO> profiles = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                profiles.add(new ProfileDTO((long) (i + 1), "Profile" + i, "Desc" + i,
                        List.of(), OffsetDateTime.now(), OffsetDateTime.now()));
            }
            return profiles;
        }
    }

    // =====================================================================
    // ParameterController pagination tests
    // =====================================================================

    @Nested
    @DisplayName("ParameterController pagination")
    class ParameterControllerPagination {

        private ParameterService parameterService;
        private ParameterController parameterController;

        @BeforeEach
        void setUp() {
            parameterService = mock(ParameterService.class);
            parameterController = new ParameterController(parameterService);
        }

        @Test
        @DisplayName("Multiple pages returns consistent metadata")
        void multiplePages_shouldHaveConsistentMetadata() {
            int size = 3;
            Pageable pageable = PageRequest.of(1, size);
            List<ParameterDTO> params = createParameters(3);
            Page<ParameterDTO> page = new PageImpl<>(params, pageable, 9);
            when(parameterService.findByCriteria(any(ParameterCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<ParameterDTO>> response = parameterController.findAll(null, null, null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(3);
        }

        @Test
        @DisplayName("Last page with fewer elements returns consistent metadata")
        void lastPagePartial_shouldHaveConsistentMetadata() {
            int size = 4;
            Pageable pageable = PageRequest.of(2, size);
            List<ParameterDTO> params = createParameters(2);
            Page<ParameterDTO> page = new PageImpl<>(params, pageable, 10);
            when(parameterService.findByCriteria(any(ParameterCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<ParameterDTO>> response = parameterController.findAll(null, null, null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(3);
            assertThat(response.getBody().getContent()).hasSize(2);
        }

        private List<ParameterDTO> createParameters(int count) {
            List<ParameterDTO> params = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                params.add(new ParameterDTO((long) (i + 1), "PARAM_" + i, "Description " + i,
                        "value" + i, ParameterType.STRING, OffsetDateTime.now(), OffsetDateTime.now()));
            }
            return params;
        }
    }

    // =====================================================================
    // ActionController pagination tests
    // =====================================================================

    @Nested
    @DisplayName("ActionController pagination")
    class ActionControllerPagination {

        private ActionService actionService;
        private ActionControllerImpl actionController;

        @BeforeEach
        void setUp() {
            actionService = mock(ActionService.class);
            actionController = new ActionControllerImpl(actionService);
        }

        @Test
        @DisplayName("Full page with explicit page/size params returns consistent metadata")
        void fullPage_shouldHaveConsistentMetadata() {
            int page = 0;
            int size = 10;
            Pageable pageable = PageRequest.of(page, size);
            List<ActionDTO> actions = createActions(10);
            Page<ActionDTO> pageResult = new PageImpl<>(actions, pageable, 14);
            when(actionService.findByCriteria(any(ActionCriteria.class), eq(pageable))).thenReturn(pageResult);

            ResponseEntity<Page<ActionDTO>> response = actionController.findAll(page, size, null, null, null, null);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(2);
        }

        @Test
        @DisplayName("Second page returns consistent metadata")
        void secondPage_shouldHaveConsistentMetadata() {
            int page = 1;
            int size = 10;
            Pageable pageable = PageRequest.of(page, size);
            List<ActionDTO> actions = createActions(4);
            Page<ActionDTO> pageResult = new PageImpl<>(actions, pageable, 14);
            when(actionService.findByCriteria(any(ActionCriteria.class), eq(pageable))).thenReturn(pageResult);

            ResponseEntity<Page<ActionDTO>> response = actionController.findAll(page, size, null, null, null, null);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(2);
            assertThat(response.getBody().getContent()).hasSize(4);
        }

        private List<ActionDTO> createActions(int count) {
            List<ActionDTO> actions = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                actions.add(new ActionDTO((long) (i + 1), "ACTION_" + i, ActionType.READ,
                        "Action " + i, "Description " + i, OffsetDateTime.now(), OffsetDateTime.now()));
            }
            return actions;
        }
    }

    // =====================================================================
    // ClusterController pagination tests (blocks)
    // =====================================================================

    @Nested
    @DisplayName("ClusterController blocks pagination")
    class ClusterControllerPagination {

        private ClusterService clusterService;
        private ClusterController clusterController;

        @BeforeEach
        void setUp() {
            clusterService = mock(ClusterService.class);
            clusterController = new ClusterController(clusterService);
        }

        @Test
        @DisplayName("Blocks page returns consistent metadata")
        void blocksPage_shouldHaveConsistentMetadata() {
            int size = 5;
            Pageable pageable = PageRequest.of(0, size);
            List<ClusterBlockDTO> blocks = createBlocks(5);
            Page<ClusterBlockDTO> page = new PageImpl<>(blocks, pageable, 8);
            when(clusterService.findBlocksByCriteria(any(ClusterBlockCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<ClusterBlockDTO>> response = clusterController.findAllBlocks(null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(2);
        }

        @Test
        @DisplayName("Empty blocks page returns consistent metadata")
        void emptyBlocksPage_shouldHaveConsistentMetadata() {
            int size = 10;
            Pageable pageable = PageRequest.of(0, size);
            Page<ClusterBlockDTO> page = new PageImpl<>(List.of(), pageable, 0);
            when(clusterService.findBlocksByCriteria(any(ClusterBlockCriteria.class), eq(pageable))).thenReturn(page);

            ResponseEntity<Page<ClusterBlockDTO>> response = clusterController.findAllBlocks(null, pageable);

            assertThat(response.getBody()).isNotNull();
            assertPaginationMetadata(response.getBody(), size);
            assertThat(response.getBody().getTotalPages()).isEqualTo(0);
        }

        private List<ClusterBlockDTO> createBlocks(int count) {
            List<ClusterBlockDTO> blocks = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                blocks.add(new ClusterBlockDTO((long) (i + 1), "TASK_" + i,
                        OffsetDateTime.now(), 100L + i, 50L + i, 200L + i, (long) (i + 1)));
            }
            return blocks;
        }
    }

    // =====================================================================
    // Cross-controller consistency: same data set sizes produce same metadata
    // =====================================================================

    @Nested
    @DisplayName("Cross-controller consistency")
    class CrossControllerConsistency {

        @Test
        @DisplayName("All controllers produce identical totalPages for same totalElements/size")
        void allControllers_sameTotalElementsAndSize_produceIdenticalTotalPages() {
            long totalElements = 27;
            int size = 10;
            int expectedTotalPages = 3; // ceil(27/10) = 3

            // Simulate pages from different controllers
            Pageable pageable = PageRequest.of(0, size);

            // User page
            Page<UserDTO> userPage = new PageImpl<>(
                    IntStream.range(0, size)
                            .mapToObj(i -> new UserDTO((long) i, "u" + i, null, "F", "L", null,
                                    null, 1L, null, List.of(), null, null))
                            .toList(),
                    pageable, totalElements);

            // Profile page
            Page<ProfileDTO> profilePage = new PageImpl<>(
                    IntStream.range(0, size)
                            .mapToObj(i -> new ProfileDTO((long) i, "P" + i, null, List.of(), null, null))
                            .toList(),
                    pageable, totalElements);

            // Parameter page
            Page<ParameterDTO> paramPage = new PageImpl<>(
                    IntStream.range(0, size)
                            .mapToObj(i -> new ParameterDTO((long) i, "C" + i, null, "v", ParameterType.STRING, null, null))
                            .toList(),
                    pageable, totalElements);

            // All should have same totalPages
            assertThat(userPage.getTotalPages()).isEqualTo(expectedTotalPages);
            assertThat(profilePage.getTotalPages()).isEqualTo(expectedTotalPages);
            assertThat(paramPage.getTotalPages()).isEqualTo(expectedTotalPages);

            // All should have consistent content sizes
            assertThat(userPage.getContent().size()).isLessThanOrEqualTo(size);
            assertThat(profilePage.getContent().size()).isLessThanOrEqualTo(size);
            assertThat(paramPage.getContent().size()).isLessThanOrEqualTo(size);
        }

        @Test
        @DisplayName("Boundary case: totalElements is exact multiple of size")
        void exactMultiple_shouldHaveNoPartialPage() {
            int size = 5;
            long totalElements = 15;
            int expectedTotalPages = 3;

            Pageable pageable = PageRequest.of(2, size); // Last page

            Page<UserDTO> page = new PageImpl<>(
                    IntStream.range(0, size)
                            .mapToObj(i -> new UserDTO((long) i, "u" + i, null, null, null, null,
                                    null, null, null, List.of(), null, null))
                            .toList(),
                    pageable, totalElements);

            assertThat(page.getTotalPages()).isEqualTo(expectedTotalPages);
            assertThat(page.getContent()).hasSize(size);
            assertThat(page.isLast()).isTrue();
        }

        @Test
        @DisplayName("Boundary case: size = 1 produces totalPages == totalElements")
        void sizeOne_shouldHaveTotalPagesEqualToTotalElements() {
            int size = 1;
            long totalElements = 7;

            Pageable pageable = PageRequest.of(0, size);

            Page<UserDTO> page = new PageImpl<>(
                    List.of(new UserDTO(1L, "u1", null, null, null, null, null, null, null, List.of(), null, null)),
                    pageable, totalElements);

            assertThat(page.getTotalPages()).isEqualTo((int) totalElements);
            assertThat(page.getContent()).hasSize(1);
        }
    }

}
