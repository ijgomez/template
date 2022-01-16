package org.myorganization.template.reports.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ReportParamEnum {

	EXPORT_TYPE("EXPORT_TYPE", "Format Type", ReportParamTypeEnum.SELECT, new ReportFormatEnum[] {
			ReportFormatEnum.PDF, ReportFormatEnum.EXCEL, ReportFormatEnum.HTML
	}),
	INIT_DATETIME("INIDATE", null, ReportParamTypeEnum.TEXTFIELD, null),
	END_DATETIME("ENDDATE", null, ReportParamTypeEnum.TEXTFIELD, null),
	NAME("NAME", null, ReportParamTypeEnum.TEXTFIELD, null),
	DESCRIPTION("DESCRIPTION", null, ReportParamTypeEnum.TEXTFIELD, null);
	
	private String key;
	
	private String description;
	
	private ReportParamTypeEnum type;
	
	private Object values;

	private ReportParamEnum(String key, String description, ReportParamTypeEnum type, Object values) {
		this.key = key;
		this.description = description;
		this.type = type;
		this.values = values;
	}
	
	
	@JsonValue
	public String getKey() {
		return key;
	}
	
	public String getDescription() {
		return description;
	}
	
	public ReportParamTypeEnum getType() {
		return type;
	}
	
	public Object getValues() {
		return values;
	}
}
