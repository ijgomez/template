package org.myorganization.template.domain.exception;

/**
 * Thrown when report export generation fails.
 * <p>
 * Maps to HTTP 500 Internal Server Error.
 */
public class ReportExportException extends RuntimeException {

    public ReportExportException(String message) {
        super(message);
    }

    public ReportExportException(String message, Throwable cause) {
        super(message, cause);
    }

}
