package org.myorganization.template.domain.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;

/**
 * Prueba de integración de la migración
 * {@code 20250112-add-cluster-node-extended-info.xml} sobre PostgreSQL 18.
 *
 * <p>Cubre: tipos y nulabilidad de las seis columnas nuevas sobre una tabla con filas,
 * omisión (MARK_RAN) cuando las columnas ya existen y {@code rollbackCount} de los seis changesets.
 */
@Testcontainers
class ClusterNodeExtendedInfoMigrationIT {

    private static final String CHANGELOG =
            "db/changelog/migrations/v1.0.0/20250112-add-cluster-node-extended-info.xml";
    private static final String SCHEMA = "template";

    private static final Map<String, String> NEW_COLUMNS = new LinkedHashMap<>();

    static {
        NEW_COLUMNS.put("processors", "integer");
        NEW_COLUMNS.put("fs_total_space", "bigint");
        NEW_COLUMNS.put("fs_free_space", "bigint");
        NEW_COLUMNS.put("fs_usable_space", "bigint");
        NEW_COLUMNS.put("jvm_properties", "text");
        NEW_COLUMNS.put("environment_properties", "text");
    }

    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:18");

    @BeforeEach
    void resetDatabase() throws SQLException {
        try (Connection c = POSTGRES.createConnection(""); Statement s = c.createStatement()) {
            s.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
            s.execute("DROP TABLE IF EXISTS public.databasechangelog");
            s.execute("DROP TABLE IF EXISTS public.databasechangeloglock");
            s.execute("CREATE SCHEMA " + SCHEMA);
        }
    }

    @Test
    void addsSixNullableColumnsKeepingExistingRows() throws Exception {
        createClusterNodeTable(false);
        insertRows();

        runUpdate();

        try (Connection c = POSTGRES.createConnection("")) {
            for (Map.Entry<String, String> col : NEW_COLUMNS.entrySet()) {
                assertThat(columnInfo(c, col.getKey()))
                        .as("columna %s", col.getKey())
                        .containsExactly(col.getValue(), "YES");
            }
            assertThat(count(c, "SELECT count(*) FROM template.cluster_node")).isEqualTo(2);
            String allNull = String.join(" AND ", NEW_COLUMNS.keySet().stream().map(n -> n + " IS NULL").toList());
            assertThat(count(c, "SELECT count(*) FROM template.cluster_node WHERE " + allNull)).isEqualTo(2);
            assertThat(changelogCount(c, "EXECTYPE", "EXECUTED")).isEqualTo(6);
        }
    }

    @Test
    void marksChangesetsAsRanWhenColumnsAlreadyExist() throws Exception {
        createClusterNodeTable(true);
        try (Connection c = POSTGRES.createConnection(""); Statement s = c.createStatement()) {
            s.execute("INSERT INTO template.cluster_node (id, hostname, processors, jvm_properties)"
                    + " VALUES (1, 'h1', 8, '{\"a\":\"b\"}')");
        }

        runUpdate();

        try (Connection c = POSTGRES.createConnection("")) {
            assertThat(changelogCount(c, "EXECTYPE", "MARK_RAN")).isEqualTo(6);
            assertThat(changelogCount(c, "EXECTYPE", "EXECUTED")).isZero();
            assertThat(count(c, "SELECT count(*) FROM template.cluster_node"
                    + " WHERE processors = 8 AND jvm_properties = '{\"a\":\"b\"}'")).isEqualTo(1);
        }
    }

    @Test
    void rollbackCountOfSixChangesetsDropsTheColumnsAndKeepsRows() throws Exception {
        createClusterNodeTable(false);
        insertRows();
        runUpdate();

        try (Liquibase liquibase = newLiquibase(POSTGRES.createConnection(""))) {
            liquibase.rollback(6, "");
        }

        try (Connection c = POSTGRES.createConnection("")) {
            for (String col : NEW_COLUMNS.keySet()) {
                assertThat(columnInfo(c, col)).as("columna %s", col).isEmpty();
            }
            assertThat(count(c, "SELECT count(*) FROM template.cluster_node")).isEqualTo(2);
            assertThat(count(c, "SELECT count(*) FROM public.databasechangelog")).isZero();
        }
    }

    private void runUpdate() throws Exception {
        try (Liquibase liquibase = newLiquibase(POSTGRES.createConnection(""))) {
            liquibase.update(new Contexts(), new LabelExpression());
        }
    }

    private Liquibase newLiquibase(Connection connection) throws Exception {
        Database database = DatabaseFactory.getInstance()
                .findCorrectDatabaseImplementation(new JdbcConnection(connection));
        Liquibase liquibase = new Liquibase(CHANGELOG, new ClassLoaderResourceAccessor(), database);
        liquibase.setChangeLogParameter("schemaName", SCHEMA);
        return liquibase;
    }

    private void createClusterNodeTable(boolean withNewColumns) throws SQLException {
        String extra = withNewColumns
                ? ", processors INTEGER, fs_total_space BIGINT, fs_free_space BIGINT, fs_usable_space BIGINT,"
                        + " jvm_properties TEXT, environment_properties TEXT"
                : "";
        try (Connection c = POSTGRES.createConnection(""); Statement s = c.createStatement()) {
            s.execute("CREATE TABLE template.cluster_node (id BIGINT PRIMARY KEY, hostname VARCHAR(255) NOT NULL"
                    + extra + ")");
        }
    }

    private void insertRows() throws SQLException {
        try (Connection c = POSTGRES.createConnection(""); Statement s = c.createStatement()) {
            s.execute("INSERT INTO template.cluster_node (id, hostname) VALUES (1, 'h1'), (2, 'h2')");
        }
    }

    /** Devuelve {data_type, is_nullable} o lista vacía si la columna no existe. */
    private List<String> columnInfo(Connection c, String column) throws SQLException {
        String sql = "SELECT data_type, is_nullable FROM information_schema.columns"
                + " WHERE table_schema = 'template' AND table_name = 'cluster_node' AND column_name = '" + column + "'";
        try (Statement s = c.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            return rs.next() ? List.of(rs.getString(1), rs.getString(2)) : List.of();
        }
    }

    private int changelogCount(Connection c, String column, String value) throws SQLException {
        return count(c, "SELECT count(*) FROM public.databasechangelog WHERE " + column + " = '" + value + "'");
    }

    private int count(Connection c, String sql) throws SQLException {
        try (Statement s = c.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            rs.next();
            return rs.getInt(1);
        }
    }
}
