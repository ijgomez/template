package org.myorganization.template.core.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;

import javax.sql.DataSource;

import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import lombok.extern.slf4j.Slf4j;

/**
 * Manages PostgreSQL session-level advisory locks that span several transactions.
 * <p>
 * A session-level advisory lock belongs to a database connection, so the lock and the
 * matching unlock must run on the <b>same</b> connection. Going through the pooled
 * transactional repositories gives no such guarantee (each call can get a different
 * connection), which leaves locks held forever. This manager pins one dedicated
 * connection per held lock key until {@link #unlock(int)} is called. If the JVM or the
 * connection dies, PostgreSQL releases the lock automatically.
 */
@Slf4j
@Component
public class AdvisoryLockManager {

    /** Maximum time to wait for the lock before failing, so a scheduler thread is never stuck forever. */
    static final int LOCK_TIMEOUT_SECONDS = 60;

    private final DataSource dataSource;
    /**
     * Runs the connection work outside any active transaction. With a container-managed
     * (JTA) datasource such as WildFly's, a connection obtained inside a transaction is
     * enlisted in it and cannot be kept after commit, so the lock connection must be
     * created and used with the transaction suspended.
     */
    private final TransactionTemplate noTransaction;
    private final ConcurrentHashMap<Integer, Connection> heldConnections = new ConcurrentHashMap<>();

    public AdvisoryLockManager(DataSource dataSource, PlatformTransactionManager transactionManager) {
        this.dataSource = dataSource;
        this.noTransaction = new TransactionTemplate(transactionManager);
        this.noTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_NOT_SUPPORTED);
    }

    /**
     * Blocks until the advisory lock for the key is obtained (or the timeout expires).
     *
     * @param lockKey the advisory lock key
     * @throws IllegalStateException if the lock cannot be obtained
     */
    public void lock(int lockKey) {
        noTransaction.executeWithoutResult(status -> doLock(lockKey));
    }

    private void doLock(int lockKey) {
        Connection connection = null;
        try {
            connection = dataSource.getConnection();
            try (PreparedStatement ps = connection.prepareStatement("SELECT pg_advisory_lock(?)")) {
                ps.setInt(1, lockKey);
                ps.setQueryTimeout(LOCK_TIMEOUT_SECONDS);
                ps.execute();
            }
            heldConnections.put(lockKey, connection);
        } catch (SQLException | RuntimeException e) {
            closeQuietly(connection);
            throw new IllegalStateException("Unable to acquire advisory lock " + lockKey, e);
        }
    }

    /**
     * Releases the advisory lock for the key on the connection that acquired it.
     * Does nothing if the lock is not held by this instance.
     *
     * @param lockKey the advisory lock key
     */
    public void unlock(int lockKey) {
        noTransaction.executeWithoutResult(status -> doUnlock(lockKey));
    }

    private void doUnlock(int lockKey) {
        Connection connection = heldConnections.remove(lockKey);
        if (connection == null) {
            return;
        }
        try (PreparedStatement ps = connection.prepareStatement("SELECT pg_advisory_unlock(?)")) {
            ps.setInt(1, lockKey);
            ps.execute();
        } catch (SQLException e) {
            log.error("Failed to release advisory lock {}", lockKey, e);
        } finally {
            closeQuietly(connection);
        }
    }

    private void closeQuietly(Connection connection) {
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                log.warn("Failed to close advisory lock connection", e);
            }
        }
    }
}
