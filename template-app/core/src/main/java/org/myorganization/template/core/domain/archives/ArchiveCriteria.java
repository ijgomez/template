package org.myorganization.template.core.domain.archives;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class ArchiveCriteria extends Criteria {

	private String filename;
	
	private String filetype;

}
