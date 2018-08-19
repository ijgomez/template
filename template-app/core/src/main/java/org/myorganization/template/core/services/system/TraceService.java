package org.myorganization.template.core.services.system;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.system.traces.Trace;
import org.myorganization.template.core.domain.system.traces.TraceCriteria;
import org.myorganization.template.core.domain.system.traces.TraceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TraceService {

	@Autowired
	private TraceRepository traceRepository;
	
	@Transactional(readOnly = true)
	public List<Trace> findAll() {
		List<Trace> traces = new ArrayList<>();
		for (Trace trace : this.traceRepository.findAll()) {
			traces.add(trace);
		}
		return traces;
	}
	
	@Transactional(readOnly = true)
	public List<Trace> findByCriteria(TraceCriteria criteria) {
		List<Trace> traces = this.traceRepository.findByCriteria(criteria);
		return traces;
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
	public Trace read(Long id) {
		Optional<Trace> trace = this.traceRepository.findById(id);
		if (trace.isPresent()) {
			return trace.get();
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Trace update(Long id, Trace trace) {
		Optional<Trace> optional = this.traceRepository.findById(id);
		if (optional.isPresent()) {
			Trace t = optional.get();
			t.setDatetime(trace.getDatetime());
			t.setMessage(trace.getMessage());
			t.setType(trace.getType());
			
			return this.traceRepository.save(t);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.traceRepository.deleteById(id);
		return id;
	}
}
