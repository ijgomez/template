package org.myorganization.template.reports.domain.reportparam;

import java.io.Serializable;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class ReportParam implements Serializable {

	private static final long serialVersionUID = -6003711279314865842L;

	private String type;
	
	private String key;
	
	private String value;
	
	private String label;
	
	private List<ReportParamOption> options;
	
	private Integer order;
	
	private Boolean required = false;

	private Boolean forPrompting  = true;
	
}
