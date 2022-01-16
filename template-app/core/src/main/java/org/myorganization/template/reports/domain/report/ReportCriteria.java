package org.myorganization.template.reports.domain.report;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class ReportCriteria extends Criteria {

	private String name;
	
	private String description;

}
