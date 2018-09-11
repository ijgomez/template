package org.myorganization.template.web.domain.datatables;

import java.util.List;

public class DataTablesResponse<E> {

	private Integer draw;
	
	private List<E> data;
	
	private Integer recordsFiltered;
	
	private Integer recordsTotal;

	public DataTablesResponse() {
		super();
	}
	
	public Integer getDraw() {
		return draw;
	}

	public void setDraw(Integer draw) {
		this.draw = draw;
	}

	public List<E> getData() {
		return data;
	}

	public void setData(List<E> data) {
		this.data = data;
	}

	public Integer getRecordsFiltered() {
		return recordsFiltered;
	}

	public void setRecordsFiltered(Integer recordsFiltered) {
		this.recordsFiltered = recordsFiltered;
	}

	public Integer getRecordsTotal() {
		return recordsTotal;
	}

	public void setRecordsTotal(Integer recordsTotal) {
		this.recordsTotal = recordsTotal;
	}
	
	
}
