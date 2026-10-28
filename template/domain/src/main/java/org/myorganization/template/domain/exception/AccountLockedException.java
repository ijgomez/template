package org.myorganization.template.domain.exception;

/**
 * Thrown when an account is temporarily locked after too many failed login attempts.
 * <p>
 * Maps to HTTP 429 Too Many Requests, with the seconds remaining until the lock
 * expires reported in the {@code Retry-After} header.
 */
public class AccountLockedException extends RuntimeException {

    private static final long serialVersionUID = -3786243102465427631L;

    private final long retryAfterSeconds;

    public AccountLockedException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    /**
     * Returns the seconds remaining until the account lock expires.
     *
     * @return seconds to wait before retrying
     */
    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

}
