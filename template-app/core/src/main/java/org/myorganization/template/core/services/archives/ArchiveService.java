package org.myorganization.template.core.services.archives;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.myorganization.template.core.domain.archives.Archive;
import org.myorganization.template.core.domain.archives.ArchiveCriteria;
import org.myorganization.template.core.domain.archives.ArchiveRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArchiveService implements TemplateService<Archive, ArchiveCriteria> {

	@Autowired
	private ArchiveRepository archiveRepository;

	@Transactional(readOnly = true)
	public List<Archive> findAll() {
		return StreamSupport.stream(this.archiveRepository.findAll().spliterator(), false).collect(Collectors.toList());
	}
	
	@Transactional(readOnly = true)
	public List<Archive> findByCriteria(ArchiveCriteria criteria) {
		return this.archiveRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ArchiveCriteria criteria) {
		return this.archiveRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public Archive create(Archive archive) {
		return this.archiveRepository.save(archive);
	}
	
	@Transactional(readOnly = true)
	public Optional<Archive> read(Long id) {
		return this.archiveRepository.findById(id);
	}
	
	@Transactional
	public Archive update(Long id, Archive archive) {
		Optional<Archive> optional = this.read(id);
		if (optional.isPresent()) {
			Archive a = optional.get();
			a.setFilename(archive.getFilename());
			a.setFiletype(archive.getFiletype());
			a.setValue(archive.getValue());
			a.setSize(archive.getSize());
			return this.archiveRepository.save(a);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.archiveRepository.deleteById(id);
		return id;
	}
}
