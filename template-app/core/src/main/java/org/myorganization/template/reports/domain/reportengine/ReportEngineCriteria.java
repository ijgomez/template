package org.myorganization.template.reports.domain.reportengine;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class ReportEngineCriteria extends Criteria {

	private String type;
	
	private String description;
	
}
