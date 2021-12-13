package org.myorganization.template.core.domain.base;

import org.apache.commons.lang3.builder.ToStringBuilder;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public abstract class Criteria {
	
	private Long id;

	private Integer pageNumber;
	
	private Integer pageSize;
	
	private String sortField;
	
	private String sortOrder;

	@Override
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}
}
