package org.myorganization.template.web.domain.datatables.criteria;

import lombok.Data;

@Data
public class DataTablesColumnCriteria {

	private String data;
	
	private String name;
	
	private Boolean searchable;
	
	private Boolean orderable;
	
	private DataTablesSearchCriteria search;

}
