package org.myorganization.template.web.domain.datatables;

import org.myorganization.template.web.domain.datatables.criteria.DataTablesParameters;

import lombok.Data;

@Data
public class DataTablesCriteria<C> {

	private C criteria;
	
	private DataTablesParameters parameters;
	
}
