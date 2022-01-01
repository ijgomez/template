package org.myorganization.template.web.domain.datatables.criteria;

import lombok.Data;

@Data
public class DataTablesCriteria {
	
	private Integer draw;
	
	private Integer start;
	
	private Integer length;
	
	private DataTablesSearchCriteria search;
	
	private DataTablesOrderCriteria[] order;
	
	private DataTablesColumnCriteria[] columns;
	
}

