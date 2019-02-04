package org.myorganization.template.reports.exceptions;

public class ReportException extends Exception {

	private static final long serialVersionUID = 7806588762709677597L;

	public ReportException(String message) {
		super(message);
	}
	
	public ReportException(String message, Throwable cause) {
		super(message, cause);
	}
}
