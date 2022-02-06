package org.myorganization.template.core.services.system;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.myorganization.template.core.domain.system.traces.Trace;
import org.myorganization.template.core.domain.system.traces.TraceCriteria;
import org.myorganization.template.core.domain.system.traces.TraceRepository;
import org.myorganization.template.core.domain.system.traces.TraceType;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TraceService implements TemplateService<Trace, TraceCriteria> {

	@Autowired
	private TraceRepository traceRepository;
	
	@Transactional(readOnly = true)
	public List<Trace> findAll() {
		return StreamSupport.stream(this.traceRepository.findAll().spliterator(), false).collect(Collectors.toList());
	}
	
	@Transactional(readOnly = true)
	public List<Trace> findByCriteria(TraceCriteria criteria) {
		return this.traceRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(TraceCriteria criteria) {
		return this.traceRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public Trace create(Trace trace) {
		return this.traceRepository.save(trace);
	}
	
	@Transactional(readOnly = true)
	public Optional<Trace> read(Long id) {
		return this.traceRepository.findById(id);
	}
	
	@Transactional
	public Trace update(Long id, Trace trace) {
		
		return this.read(id).map(t -> {
			t.setDatetime(trace.getDatetime());
			t.setMessage(trace.getMessage());
			t.setType(trace.getType());
			
			return this.traceRepository.save(t);
		}).orElseGet(() -> null);
	}
	
	@Transactional
	public Long delete(Long id) {
		this.traceRepository.deleteById(id);
		return id;
	}
	
	@Transactional(readOnly = true)
	public List<TraceType> getAllTypes() {
		return Arrays.asList(TraceType.values());
	}
}
