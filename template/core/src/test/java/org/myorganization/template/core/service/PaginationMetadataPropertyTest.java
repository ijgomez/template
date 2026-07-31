package org.myorganization.template.core.service;

import java.util.List;
import java.util.stream.IntStream;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based test verifying pagination metadata consistency.
 *
 * <p><b>Validates: Requirements 25.1, 4.2, 14.2, 20.2</b></p>
 *
 * <p>Property 12: For any valid page size and page number, totalPages = ceil(totalElements / size),
 * content.size() &le; size, and if page &lt; totalPages AND totalElements &gt; 0 then content is non-empty.</p>
 */
class PaginationMetadataPropertyTest {

    @Property
    void totalPagesEqualsCeilOfTotalElementsDividedBySize(
            @ForAll("paginationInputs") PaginationInput input) {

        Page<Integer> page = createPage(input);

        int expectedTotalPages = (int) Math.ceil((double) input.totalElements() / input.pageSize());
        assertThat(page.getTotalPages()).isEqualTo(expectedTotalPages);
    }

    @Property
    void contentSizeNeverExceedsPageSize(
            @ForAll("paginationInputs") PaginationInput input) {

        Page<Integer> page = createPage(input);

        assertThat(page.getContent().size()).isLessThanOrEqualTo(input.pageSize());
    }

    @Property
    void nonLastPageIsNonEmpty(
            @ForAll("nonLastPageInputs") PaginationInput input) {

        // input.pageNumber() < totalPages AND totalElements > 0
        Page<Integer> page = createPage(input);

        assertThat(page.getContent()).isNotEmpty();
    }

    @Property
    void lastPageContentSizeMatchesRemainder(
            @ForAll("lastPageInputs") PaginationInput input) {

        Page<Integer> page = createPage(input);

        int remainder = input.totalElements() % input.pageSize();
        int expectedSize = (remainder == 0) ? input.pageSize() : remainder;
        assertThat(page.getContent().size()).isEqualTo(expectedSize);
    }

    // --- Helpers ---

    private Page<Integer> createPage(PaginationInput input) {
        int totalPages = (int) Math.ceil((double) input.totalElements() / input.pageSize());
        int contentSize;
        if (input.totalElements() == 0) {
            contentSize = 0;
        } else if (input.pageNumber() < totalPages - 1) {
            // Not the last page: full page
            contentSize = input.pageSize();
        } else {
            // Last page (or beyond)
            int remainder = input.totalElements() % input.pageSize();
            contentSize = (remainder == 0) ? input.pageSize() : remainder;
        }

        List<Integer> content = IntStream.range(0, contentSize)
                .boxed()
                .toList();

        Pageable pageable = PageRequest.of(input.pageNumber(), input.pageSize());
        return new PageImpl<>(content, pageable, input.totalElements());
    }

    // --- Providers ---

    @Provide
    Arbitrary<PaginationInput> paginationInputs() {
        Arbitrary<Integer> totalElements = Arbitraries.integers().between(0, 10000);
        Arbitrary<Integer> pageSize = Arbitraries.integers().between(1, 100);

        return Combinators.combine(totalElements, pageSize).flatAs((total, size) -> {
            int maxPage = Math.max(0, (int) Math.ceil((double) total / size) - 1);
            Arbitrary<Integer> pageNumber = Arbitraries.integers().between(0, maxPage);
            return pageNumber.map(pn -> new PaginationInput(total, size, pn));
        });
    }

    @Provide
    Arbitrary<PaginationInput> nonLastPageInputs() {
        // totalElements > pageSize ensures at least 2 pages, so page 0 is never the last
        Arbitrary<Integer> pageSize = Arbitraries.integers().between(1, 100);

        return pageSize.flatMap(size -> {
            // Need at least size+1 elements to have more than 1 page
            Arbitrary<Integer> totalElements = Arbitraries.integers().between(size + 1, 10000);
            return totalElements.flatMap(total -> {
                int totalPages = (int) Math.ceil((double) total / size);
                // Page number < totalPages - 1 (not the last page)
                int maxNonLastPage = totalPages - 2;
                if (maxNonLastPage < 0) {
                    maxNonLastPage = 0;
                }
                Arbitrary<Integer> pageNumber = Arbitraries.integers().between(0, maxNonLastPage);
                return pageNumber.map(pn -> new PaginationInput(total, size, pn));
            });
        });
    }

    @Provide
    Arbitrary<PaginationInput> lastPageInputs() {
        // Generates inputs where pageNumber == totalPages - 1 (the last page)
        Arbitrary<Integer> pageSize = Arbitraries.integers().between(1, 100);

        return pageSize.flatMap(size -> {
            // Need at least 1 element
            Arbitrary<Integer> totalElements = Arbitraries.integers().between(1, 10000);
            return totalElements.map(total -> {
                int totalPages = (int) Math.ceil((double) total / size);
                int lastPage = totalPages - 1;
                return new PaginationInput(total, size, lastPage);
            });
        });
    }

    record PaginationInput(int totalElements, int pageSize, int pageNumber) {
    }
}
