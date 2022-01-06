package org.myorganization.template.web.domain.datatables.criteria;

import lombok.Data;

@Data
public class DataTablesColumn {

	private String data;
	
	private String name;
	
	private Boolean searchable;
	
	private Boolean orderable;
	
	private DataTablesSearch search;

}
