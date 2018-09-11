package org.myorganization.template.web.domain.datatables.criteria;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class DataTablesCriteria {
	
	private Integer draw;
	
	private Integer start;
	
	private Integer length;
	
	private DataTablesSearchCriteria search;
	
	private DataTablesOrderCriteria[] order;
	
	private DataTablesColumnCriteria[] columns;

	public DataTablesCriteria() {
		super();
	}

	public Integer getDraw() {
		return draw;
	}

	public void setDraw(Integer draw) {
		this.draw = draw;
	}

	public Integer getStart() {
		return start;
	}

	public void setStart(Integer start) {
		this.start = start;
	}

	public Integer getLength() {
		return length;
	}

	public void setLength(Integer length) {
		this.length = length;
	}

	public DataTablesSearchCriteria getSearch() {
		return search;
	}

	public void setSearch(DataTablesSearchCriteria search) {
		this.search = search;
	}

	public DataTablesOrderCriteria[] getOrder() {
		return order;
	}

	public void setOrder(DataTablesOrderCriteria[] order) {
		this.order = order;
	}

	public DataTablesColumnCriteria[] getColumns() {
		return columns;
	}

	public void setColumns(DataTablesColumnCriteria[] columns) {
		this.columns = columns;
	}
	
	@Override
	public int hashCode() {
		return HashCodeBuilder.reflectionHashCode(this, true);
	}
	
	@Override
	public boolean equals(Object obj) {
		return EqualsBuilder.reflectionEquals(this, obj, true);
	}
	
	@Override
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}
}

