package org.myorganization.template.reports.enums;

public enum ReportParamTypeEnum {
	SELECT("SELECT"),
	TEXTFIELD("INPUT");
	
	private String type;
	
	private ReportParamTypeEnum(String type) {
		this.type = type;
	}
	
	public String getType() {
		return type;
	}
}
