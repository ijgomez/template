package org.myorganization.template.core.domain.base;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class Criteria {
	
	private Long id;

	private Integer pageNumber;
	
	private Integer pageSize;
	
	private String sortField;
	
	private String sortOrder;
	
	public Long getId() {
		return id;
	}
	
	public void setId(Long id) {
		this.id = id;
	}
	
	public Integer getPageNumber() {
		return pageNumber;
	}
	
	public void setPageNumber(Integer pageNumber) {
		this.pageNumber = pageNumber;
	}
	
	public Integer getPageSize() {
		return pageSize;
	}
	
	public void setPageSize(Integer pageSize) {
		this.pageSize = pageSize;
	}
	
	public String getSortField() {
		return sortField;
	}
	
	public void setSortField(String sortField) {
		this.sortField = sortField;
	}
	
	public String getSortOrder() {
		return sortOrder;
	}
	
	public void setSortOrder(String sortOrder) {
		this.sortOrder = sortOrder;
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
