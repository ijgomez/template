package org.myorganization.template.web.domain.datatables.criteria;

import lombok.Data;

@Data
public class DataTablesParameters {
	
	private Integer draw;
	
	private Integer start;
	
	private Integer length;
	
	private DataTablesSearch search;
	
	private DataTablesOrder[] order;
	
	private DataTablesColumn[] columns;
	
}

