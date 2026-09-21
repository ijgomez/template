package org.myorganization.template.core.service;

import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.entity.ClusterBlock;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClusterBlockService extends AbstractCriteriaService<ClusterBlock, ClusterBlockDTO, ClusterBlockCriteria> {

    private final ClusterBlockRepository clusterBlockRepository;

    public ClusterBlockService(ClusterBlockRepository clusterBlockRepository) {
        super(clusterBlockRepository);
        this.clusterBlockRepository = clusterBlockRepository;
    }

    @Transactional(readOnly = true)
    public ClusterBlockDTO findById(Long id) {
        ClusterBlock block = clusterBlockRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClusterBlock", id));
        return toDTO(block);
    }

    public ClusterBlockDTO create(ClusterBlockDTO dto) {
        throw new MethodNotAllowedException("Cluster block creation is not allowed. Blocks are managed by the system.");
    }

    public ClusterBlockDTO update(Long id, ClusterBlockDTO dto) {
        throw new MethodNotAllowedException("Cluster block update is not allowed. Blocks are managed by the system.");
    }

    public void delete(Long id) {
        throw new MethodNotAllowedException("Cluster block deletion is not allowed. Blocks are managed by the system.");
    }

    @Override
    protected Specification<ClusterBlock> buildSpecification(ClusterBlockCriteria criteria) {
        Specification<ClusterBlock> spec = (root, query, cb) -> cb.conjunction();

        if (criteria != null && criteria.name() != null && !criteria.name().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + criteria.name().toLowerCase() + "%"));
        }

        return spec;
    }

    @Override
    protected ClusterBlockDTO toDTO(ClusterBlock entity) {
        return new ClusterBlockDTO(
                entity.getId(),
                entity.getName(),
                entity.getStartDate(),
                entity.getAvgTime(),
                entity.getMinTime(),
                entity.getMaxTime(),
                entity.getTotal()
        );
    }
}
