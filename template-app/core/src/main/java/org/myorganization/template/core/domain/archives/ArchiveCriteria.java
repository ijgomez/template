package org.myorganization.template.core.domain.archives;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class ArchiveCriteria extends Criteria {

	private String filename;
	
	private String filetype;

}
