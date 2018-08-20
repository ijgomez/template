package org.myorganization.template.core.services.system;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.system.traces.Trace;
import org.myorganization.template.core.domain.system.traces.TraceCriteria;
import org.myorganization.template.core.domain.system.traces.TraceRepository;
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
	public Optional<Trace> read(Long id) {
		return this.traceRepository.findById(id);
	}
	
	@Transactional
	public Trace update(Long id, Trace trace) {
		Optional<Trace> optional = this.read(id);
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
