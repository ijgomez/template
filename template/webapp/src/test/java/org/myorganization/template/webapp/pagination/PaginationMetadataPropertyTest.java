package org.myorganization.template.webapp.pagination;

import java.util.List;
import java.util.stream.IntStream;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.constraints.IntRange;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based test verifying mathematical invariants of Spring Data Page pagination metadata.
 *
 * <p><b>Validates: Requirements 25.1, 4.2, 14.2, 20.2</b></p>
 *
 * <p>Property 12: Pagination metadata consistency — for any valid page size and number,
 * totalPages = ceil(totalElements/size), content ≤ size, page &lt; totalPages → non-empty.</p>
 */
class PaginationMetadataPropertyTest {

    // =========================================================================
    // Helper
    // =========================================================================

    /**
     * Creates a simulated Page mimicking Spring Data pagination behavior.
     */
    private Page<Integer> createSimulatedPage(int totalElements, int pageNumber, int pageSize) {
        List<Integer> allData = IntStream.range(0, totalElements).boxed().toList();
        int start = pageNumber * pageSize;
        int end = Math.min(start + pageSize, allData.size());
        List<Integer> content = start < allData.size() ? allData.subList(start, end) : List.of();
        return new PageImpl<>(content, PageRequest.of(pageNumber, pageSize), totalElements);
    }

    // =========================================================================
    // Property 1: totalPages equals the ceiling formula
    // =========================================================================

    @Property
    void totalPagesEqualsFormula(
            @ForAll @IntRange(min = 0, max = 10000) int totalElements,
            @ForAll @IntRange(min = 1, max = 100) int pageSize) {

        Page<Integer> page = createSimulatedPage(totalElements, 0, pageSize);

        int expectedTotalPages = (int) Math.ceil((double) totalElements / pageSize);

        assertThat(page.getTotalPages())
                .as("totalPages should be ceil(%d / %d) = %d", totalElements, pageSize, expectedTotalPages)
                .isEqualTo(expectedTotalPages);
    }

    // =========================================================================
    // Property 2: content size never exceeds page size
    // =========================================================================

    @Property
    void contentSizeNeverExceedsPageSize(
            @ForAll @IntRange(min = 0, max = 10000) int totalElements,
            @ForAll @IntRange(min = 1, max = 100) int pageSize) {

        Page<Integer> page = createSimulatedPage(totalElements, 0, pageSize);

        assertThat(page.getContent().size())
                .as("content size should never exceed pageSize (%d)", pageSize)
                .isLessThanOrEqualTo(pageSize);
    }

    // =========================================================================
    // Property 3: non-last page always has full content (pageSize elements)
    // =========================================================================

    @Property
    void nonLastPageAlwaysHasFullContent(@ForAll("nonLastPageInputs") NonLastPageInput input) {

        Page<Integer> page = createSimulatedPage(input.totalElements(), input.pageNumber(), input.pageSize());

        assertThat(page.getContent().size())
                .as("non-last page %d should have exactly %d elements (totalElements=%d, pageSize=%d)",
                        input.pageNumber(), input.pageSize(), input.totalElements(), input.pageSize())
                .isEqualTo(input.pageSize());
    }

    @Provide
    Arbitrary<NonLastPageInput> nonLastPageInputs() {
        return Arbitraries.integers().between(1, 100).flatMap(pageSize ->
                Arbitraries.integers().between(pageSize + 1, 10000).flatMap(totalElements -> {
                    int totalPages = (int) Math.ceil((double) totalElements / pageSize);
                    // pageNumber from 0 to totalPages-2 (non-last pages)
                    return Arbitraries.integers().between(0, totalPages - 2)
                            .map(pageNumber -> new NonLastPageInput(totalElements, pageNumber, pageSize));
                })
        );
    }

    record NonLastPageInput(int totalElements, int pageNumber, int pageSize) {}

    // =========================================================================
    // Property 4: last page has expected size
    // =========================================================================

    @Property
    void lastPageHasExpectedSize(
            @ForAll @IntRange(min = 1, max = 10000) int totalElements,
            @ForAll @IntRange(min = 1, max = 100) int pageSize) {

        int totalPages = (int) Math.ceil((double) totalElements / pageSize);
        int lastPageNumber = totalPages - 1;

        Page<Integer> page = createSimulatedPage(totalElements, lastPageNumber, pageSize);

        int remainder = totalElements % pageSize;
        int expectedLastPageSize = (remainder == 0) ? pageSize : remainder;

        assertThat(page.getContent().size())
                .as("last page (page %d) should have %d elements (totalElements=%d, pageSize=%d)",
                        lastPageNumber, expectedLastPageSize, totalElements, pageSize)
                .isEqualTo(expectedLastPageSize);
    }

    // =========================================================================
    // Property 5: empty total has zero pages and empty content
    // =========================================================================

    @Property
    void emptyTotalHasZeroPagesAndEmptyContent(
            @ForAll @IntRange(min = 1, max = 100) int pageSize) {

        Page<Integer> page = createSimulatedPage(0, 0, pageSize);

        // Spring Data returns 0 totalPages for empty result (with PageImpl)
        assertThat(page.getTotalPages())
                .as("totalPages should be 0 when totalElements is 0")
                .isEqualTo(0);

        assertThat(page.getContent())
                .as("content should be empty when totalElements is 0")
                .isEmpty();

        assertThat(page.getTotalElements())
                .as("totalElements should be 0")
                .isEqualTo(0);
    }
}
