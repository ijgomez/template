package org.myorganization.template.web.exceptions;

import org.myorganization.template.reports.exceptions.ReportException;
import org.myorganization.template.web.domain.MessageResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

/**
 * Class that intercepts all expected errors generated by controllers.
 * 
 * @author jizquierdo
 *
 */
@ControllerAdvice
public class AppResponseEntityExceptionHandler  {

	/**
	 * Data integrity error in database operations.
	 * 
	 * @param ex
	 *            Error.
	 * @param request
	 *            Request that causes the error.
	 * @return Response.
	 */
	@ExceptionHandler({ DataIntegrityViolationException.class })
    public ResponseEntity<MessageResponse> handleBadRequest(final DataIntegrityViolationException ex, final WebRequest request) {
		
		MessageResponse m = new MessageResponse();
		m.setMessage(ex.getMessage());

		return ResponseEntity.badRequest().body(m);
    }
	
	@ExceptionHandler({ InvalidDataAccessApiUsageException.class })
    public ResponseEntity<MessageResponse> handleBadRequest(final InvalidDataAccessApiUsageException ex, final WebRequest request) {
		
		MessageResponse m = new MessageResponse();
		m.setMessage(ex.getMessage());

		return ResponseEntity.badRequest().body(m);
    }
	
	@ExceptionHandler({ EmptyResultDataAccessException.class })
	public ResponseEntity<MessageResponse> handleNotFoundRequest(final EmptyResultDataAccessException ex, final WebRequest request) {
		
		MessageResponse m = new MessageResponse();
		m.setMessage(ex.getMessage());

		return ResponseEntity.notFound().build();
    }
	
	@ExceptionHandler({ ReportException.class })
	public ResponseEntity<MessageResponse> handleReportRequest(final ReportException ex, final WebRequest request) {
		MessageResponse m = new MessageResponse();
		m.setMessage(ex.getMessage());
		if (ex.getCause() != null) {
			m.setDetails(ex.getCause().getCause().getMessage());
		}
		return ResponseEntity.badRequest().body(m);
	}
	
}
