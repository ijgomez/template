package org.myorganization.template.core.domain.reports;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ReportParamOption implements Serializable {

	private static final long serialVersionUID = -6003711279314865842L;

	private String key;
	
	private String value;

	public ReportParamOption(String key, String value) {
		super();
		this.key = key;
		this.value = value;
	}
}
