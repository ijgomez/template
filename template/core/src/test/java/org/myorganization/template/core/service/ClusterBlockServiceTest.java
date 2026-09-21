package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.entity.ClusterBlock;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClusterBlockServiceTest {

    @Mock
    private ClusterBlockRepository clusterBlockRepository;

    private ClusterBlockService clusterBlockService;

    @BeforeEach
    void setUp() {
        clusterBlockService = new ClusterBlockService(clusterBlockRepository);
    }

    @Test
    void findByCriteria_returnsPaginatedResults() {
        ClusterBlock block = createBlock(1L, "HEARTBEAT", 150L, 100L, 200L, 10L);
        Page<ClusterBlock> page = new PageImpl<>(List.of(block), PageRequest.of(0, 10), 1);
        Pageable pageable = PageRequest.of(0, 10);

        when(clusterBlockRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Page<ClusterBlockDTO> result = clusterBlockService.findByCriteria(new ClusterBlockCriteria(null), pageable);

        assertThat(result.getTotalElements()).isEqualTo(1L);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().name()).isEqualTo("HEARTBEAT");
    }

    @Test
    void countByCriteria_returnsTotalMatching() {
        when(clusterBlockRepository.count(any(Specification.class))).thenReturn(3L);

        long count = clusterBlockService.countByCriteria(new ClusterBlockCriteria("HEART"));

        assertThat(count).isEqualTo(3L);
    }

    @Test
    void findById_existingBlock_returnsDto() {
        ClusterBlock block = createBlock(1L, "HEARTBEAT", 150L, 100L, 200L, 10L);
        when(clusterBlockRepository.findById(1L)).thenReturn(Optional.of(block));

        ClusterBlockDTO result = clusterBlockService.findById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("HEARTBEAT");
        assertThat(result.avgTime()).isEqualTo(150L);
    }

    @Test
    void findById_missingBlock_throwsNotFound() {
        when(clusterBlockRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clusterBlockService.findById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("ClusterBlock");
    }

    private ClusterBlock createBlock(Long id, String name, Long avgTime, Long minTime, Long maxTime, Long total) {
        ClusterBlock block = new ClusterBlock();
        block.setId(id);
        block.setName(name);
        block.setStartDate(OffsetDateTime.now(ZoneOffset.UTC));
        block.setAvgTime(avgTime);
        block.setMinTime(minTime);
        block.setMaxTime(maxTime);
        block.setTotal(total);
        return block;
    }
}
