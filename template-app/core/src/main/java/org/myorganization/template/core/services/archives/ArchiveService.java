package org.myorganization.template.core.services.archives;

import java.util.List;

import org.myorganization.template.core.domain.archives.Archive;
import org.myorganization.template.core.domain.archives.ArchiveCriteria;
import org.myorganization.template.core.domain.archives.ArchiveRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArchiveService extends TemplateServiceBase<Archive, ArchiveCriteria> implements TemplateService<Archive, ArchiveCriteria> {

	@Autowired
	public ArchiveService(ArchiveRepository archiveRepository) {
		super(archiveRepository);
	}

	@Transactional(readOnly = true)
	public List<Archive> findByCriteria(ArchiveCriteria criteria) {
		return ((ArchiveRepository) super.getRepository()).findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ArchiveCriteria criteria) {
		return ((ArchiveRepository) super.getRepository()).countByCriteria(criteria);
	}
	
	@Transactional
	public Archive update(Long id, Archive archive) {
		return this.read(id).map(a -> {
			
			a.setFilename(archive.getFilename());
			a.setFiletype(archive.getFiletype());
			a.setData(archive.getData());
			a.setSize(archive.getSize());
			
			return super.getRepository().save(a);
		}).orElseGet(() -> null);

	}

}
