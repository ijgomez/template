package org.myorganization.template.core.domain.reports;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class ReportCriteria extends Criteria {

	private String name;
	
	private String description;

}
