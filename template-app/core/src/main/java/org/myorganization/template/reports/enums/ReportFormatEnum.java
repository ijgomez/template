package org.myorganization.template.reports.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ReportFormatEnum {

	PDF("pdf", "PDF", "pdf"),
	EXCEL("excel", "EXCEL", "xls"),
	HTML("html", "HTML", "html");
	
	
	private String key;
	
	private String description;
	
	private String extension;
	
	private ReportFormatEnum(String key, String description, String extension) {
		this.key = key;
		this.description = description;
		this.extension = extension;
	}
	
	@JsonValue
	public String getKey() {
		return key;
	}
	
	public String getDescription() {
		return description;
	}
	
	public String getExtension() {
		return extension;
	}

	public static ReportFormatEnum findByKey(String key) {
		for (ReportFormatEnum format : ReportFormatEnum.values()) {
			if (format.getKey().equals(key)) {
				return format;
			}
		}
		throw new IllegalArgumentException(key);
	}
}
