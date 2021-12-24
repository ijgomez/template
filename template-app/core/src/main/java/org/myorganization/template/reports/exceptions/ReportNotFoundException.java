package org.myorganization.template.reports.exceptions;

public class ReportNotFoundException extends ReportException {

	private static final long serialVersionUID = -8230178759659417360L;

	public ReportNotFoundException(String message) {
		super(message);
	}
	
	public ReportNotFoundException(String message, Throwable cause) {
		super(message, cause);
	}
}
