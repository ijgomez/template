package org.myorganization.template.domain.exception;

/**
 * Thrown when report export generation fails.
 * <p>
 * Maps to HTTP 500 Internal Server Error.
 */
public class ReportExportException extends RuntimeException {

    private static final long serialVersionUID = 2292783841048332600L;

	public ReportExportException(String message) {
        super(message);
    }

    public ReportExportException(String message, Throwable cause) {
        super(message, cause);
    }

}
