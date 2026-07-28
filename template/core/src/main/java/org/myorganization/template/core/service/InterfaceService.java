package org.myorganization.template.core.service;

import org.myorganization.template.core.repository.InterfaceLogRepository;
import org.myorganization.template.core.repository.InterfaceRepository;
import org.myorganization.template.domain.criteria.InterfaceLogCriteria;
import org.myorganization.template.domain.dto.InterfaceDTO;
import org.myorganization.template.domain.dto.InterfaceLogDTO;
import org.myorganization.template.domain.entity.Interface;
import org.myorganization.template.domain.entity.InterfaceLog;
import org.myorganization.template.domain.enums.InterfaceLogStatus;
import org.myorganization.template.domain.enums.InterfaceOperationType;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for interface monitoring (read-only) and automatic operation logging.
 * <p>
 * Interfaces are managed externally; this service exposes only GET operations.
 * CUD operations on interfaces throw {@link MethodNotAllowedException}.
 * Interface logs are append-only and immutable.
 */
@Service
public class InterfaceService {

    private final InterfaceRepository interfaceRepository;
    private final InterfaceLogRepository interfaceLogRepository;

    public InterfaceService(InterfaceRepository interfaceRepository,
                            InterfaceLogRepository interfaceLogRepository) {
        this.interfaceRepository = interfaceRepository;
        this.interfaceLogRepository = interfaceLogRepository;
    }

    // ─── Interface (configuration) ───────────────────────────────────────────────

    /**
     * Lists all registered interfaces with their current status.
     *
     * @return list of all interfaces as DTOs
     */
    @Transactional(readOnly = true)
    public List<InterfaceDTO> findAll() {
        return interfaceRepository.findAll().stream()
                .map(this::toInterfaceDTO)
                .toList();
    }

    /**
     * Finds an interface by its identifier.
     *
     * @param id the interface identifier
     * @return the interface as a DTO
     * @throws EntityNotFoundException if no interface exists with the given id
     */
    @Transactional(readOnly = true)
    public InterfaceDTO findById(Long id) {
        Interface entity = interfaceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Interface", id));
        return toInterfaceDTO(entity);
    }

    /**
     * Rejects interface creation. Interfaces are managed externally.
     *
     * @param dto ignored
     * @throws MethodNotAllowedException always
     */
    public InterfaceDTO create(InterfaceDTO dto) {
        throw new MethodNotAllowedException("Interface creation is not allowed via API. Interfaces are managed externally.");
    }

    /**
     * Rejects interface update. Interfaces are read-only via API.
     *
     * @param id  ignored
     * @param dto ignored
     * @throws MethodNotAllowedException always
     */
    public InterfaceDTO update(Long id, InterfaceDTO dto) {
        throw new MethodNotAllowedException("Interface update is not allowed via API. Interfaces are managed externally.");
    }

    /**
     * Rejects interface deletion. Interfaces are read-only via API.
     *
     * @param id ignored
     * @throws MethodNotAllowedException always
     */
    public void delete(Long id) {
        throw new MethodNotAllowedException("Interface deletion is not allowed via API. Interfaces are managed externally.");
    }

    // ─── InterfaceLog (monitor) ──────────────────────────────────────────────────

    /**
     * Finds interface logs matching the given criteria with pagination.
     *
     * @param criteria the filter criteria (fecha, tipo operación, interfaz, status)
     * @param pageable the pagination information
     * @return a page of interface log DTOs
     */
    @Transactional(readOnly = true)
    public Page<InterfaceLogDTO> findLogsByCriteria(InterfaceLogCriteria criteria, Pageable pageable) {
        Specification<InterfaceLog> spec = buildLogSpecification(criteria);
        return interfaceLogRepository.findAll(spec, pageable).map(this::toInterfaceLogDTO);
    }

    /**
     * Counts interface logs matching the given criteria.
     *
     * @param criteria the filter criteria
     * @return the total count of matching logs
     */
    @Transactional(readOnly = true)
    public long countLogsByCriteria(InterfaceLogCriteria criteria) {
        Specification<InterfaceLog> spec = buildLogSpecification(criteria);
        return interfaceLogRepository.count(spec);
    }

    /**
     * Finds an interface log entry by its identifier.
     *
     * @param id the interface log identifier
     * @return the interface log as a DTO
     * @throws EntityNotFoundException if no log entry exists with the given id
     */
    @Transactional(readOnly = true)
    public InterfaceLogDTO findLogById(Long id) {
        InterfaceLog log = interfaceLogRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("InterfaceLog", id));
        return toInterfaceLogDTO(log);
    }

    // ─── Internal: programmatic logging ──────────────────────────────────────────

    /**
     * Programmatically logs an interface operation. This method is used internally
     * by the system to record interface operations (append-only, immutable).
     *
     * @param operationType   the direction of the operation (IN or OUT)
     * @param interfaceName   the name of the interface involved
     * @param requestPayload  the request payload (nullable)
     * @param responsePayload the response payload (nullable)
     * @param status          the result status (SUCCESS or ERROR)
     */
    @Transactional
    public void logOperation(InterfaceOperationType operationType,
                             String interfaceName,
                             String requestPayload,
                             String responsePayload,
                             InterfaceLogStatus status) {
        InterfaceLog log = new InterfaceLog();
        log.setOperationType(operationType);
        log.setInterfaceName(interfaceName);
        log.setRequestPayload(requestPayload);
        log.setResponsePayload(responsePayload);
        log.setStatus(status);
        interfaceLogRepository.save(log);
    }

    // ─── Specification builder ───────────────────────────────────────────────────

    private Specification<InterfaceLog> buildLogSpecification(InterfaceLogCriteria criteria) {
        Specification<InterfaceLog> spec = (root, query, cb) -> cb.conjunction();

        if (criteria.fromDate() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("timestamp"), criteria.fromDate()));
        }

        if (criteria.toDate() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("timestamp"), criteria.toDate()));
        }

        if (criteria.operationType() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("operationType"), criteria.operationType()));
        }

        if (criteria.interfaceName() != null && !criteria.interfaceName().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("interfaceName")),
                            "%" + criteria.interfaceName().toLowerCase() + "%"));
        }

        if (criteria.status() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), criteria.status()));
        }

        return spec;
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────────

    private InterfaceDTO toInterfaceDTO(Interface entity) {
        return new InterfaceDTO(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getUrl(),
                entity.getProtocol(),
                entity.getStatus(),
                entity.getCheckFrequency(),
                entity.getCreatedAt(),
                entity.getLastModifiedAt()
        );
    }

    private InterfaceLogDTO toInterfaceLogDTO(InterfaceLog log) {
        return new InterfaceLogDTO(
                log.getId(),
                log.getTimestamp(),
                log.getOperationType(),
                log.getInterfaceName(),
                log.getRequestPayload(),
                log.getResponsePayload(),
                log.getStatus()
        );
    }
}
