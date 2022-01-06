package org.myorganization.template.web.controller;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.archives.Archive;
import org.myorganization.template.core.domain.archives.ArchiveCriteria;
import org.myorganization.template.core.services.archives.ArchiveService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Archive Controller.
 * @author ijgomez
 *
 */
@RestController
@Validated
@RequestMapping("/api/archives")
public class ArchiveController extends TemplateControllerBase<Archive, ArchiveCriteria> implements TemplateController<Archive, ArchiveCriteria> {
	
	@Autowired
	public ArchiveController(ArchiveService archiveService) {
		super(archiveService);
	}
	
	@Override
	protected ArchiveCriteria buildCriteria(DataTablesCriteria<ArchiveCriteria> dtCriteria) {
		ArchiveCriteria criteria;

		criteria = (dtCriteria.getCriteria() != null) ? dtCriteria.getCriteria() : new ArchiveCriteria();

		if (StringUtils.isNotEmpty(dtCriteria.getParameters().getSearch().getValue())) {
			criteria.setFilename(dtCriteria.getParameters().getSearch().getValue());
		}

		return criteria;
	}

}
