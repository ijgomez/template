package org.myorganization.template.webapp.integration;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.myorganization.template.core.repository.ClusterJobRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.core.repository.ClusterTaskRepository;
import org.myorganization.template.domain.entity.ClusterJob;
import org.myorganization.template.domain.entity.ClusterJobPK;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.entity.ClusterTask;
import org.myorganization.template.domain.enums.NodeStatus;
import org.myorganization.template.webapp.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for cluster job endpoints against the real {@code SecurityConfig}.
 *
 * <p>Verifies action-based authorization for the task catalog and the job write
 * operations, and that job DELETE is allowed (204) rather than blocked as a node
 * delete (405). Also asserts the repository ordering of jobs by priority.</p>
 *
 * <p>Uses a real PostgreSQL database via Testcontainers.</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class ClusterJobSecurityIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18-alpine")
            .withDatabaseName("template_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // This test manages its own container and supplies a plain jdbc:postgresql:// URL,
        // so override the Testcontainers JDBC-URL driver configured in application-test.yml
        // with the standard PostgreSQL driver to match the URL.
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.liquibase.enabled", () -> "true");
        registry.add("spring.liquibase.change-log", () -> "classpath:db/changelog/db.changelog-test.xml");
        registry.add("spring.liquibase.contexts", () -> "test");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ClusterNodeRepository clusterNodeRepository;

    @Autowired
    private ClusterTaskRepository clusterTaskRepository;

    @Autowired
    private ClusterJobRepository clusterJobRepository;

    private Long nodeId;
    private Long taskId;

    @BeforeEach
    void setUp() {
        clusterJobRepository.deleteAll();

        ClusterTask task = clusterTaskRepository.findByName("NODOS")
                .orElseGet(() -> {
                    ClusterTask t = new ClusterTask();
                    t.setName("NODOS");
                    t.setDescription("Cluster node management");
                    t.setNodes(1);
                    t.setMinNodes(1);
                    return clusterTaskRepository.save(t);
                });
        taskId = task.getId();

        ClusterNode node = new ClusterNode();
        node.setHostname("sec-test-node-" + System.nanoTime());
        node.setIp("10.0.0.1");
        node.setStatus(NodeStatus.ACTIVE);
        node.setMaster(false);
        node.setStartedAt(OffsetDateTime.now(ZoneOffset.UTC));
        node = clusterNodeRepository.save(node);
        nodeId = node.getId();
    }

    private String token(String... authorities) {
        return jwtTokenProvider.generateAccessToken("secuser", "TestProfile", List.of(authorities));
    }

    // =====================================================================
    // Task catalog authorization
    // =====================================================================

    @Test
    void getTasks_withoutClusterAuthority_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/administration/cluster/tasks")
                        .header("Authorization", "Bearer " + token("USER_READ")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getTasks_withClusterRead_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/administration/cluster/tasks")
                        .header("Authorization", "Bearer " + token("CLUSTER_NODE_READ")))
                .andExpect(status().isOk());
    }

    // =====================================================================
    // Job write authorization
    // =====================================================================

    @Test
    void postJob_withoutClusterWrite_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/administration/cluster/nodes/" + nodeId + "/jobs")
                        .header("Authorization", "Bearer " + token("CLUSTER_NODE_READ"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clusterTaskId\":" + taskId + ",\"priority\":1,\"enabled\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void putJob_withoutClusterWrite_returns403() throws Exception {
        mockMvc.perform(put("/api/v1/administration/cluster/nodes/" + nodeId + "/jobs/" + taskId)
                        .header("Authorization", "Bearer " + token("CLUSTER_NODE_READ"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"priority\":2,\"enabled\":false}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteJob_withoutClusterWrite_returns403() throws Exception {
        mockMvc.perform(delete("/api/v1/administration/cluster/nodes/" + nodeId + "/jobs/" + taskId)
                        .header("Authorization", "Bearer " + token("CLUSTER_NODE_READ")))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteJob_withClusterWrite_onSeededJob_returns204NotMethodNotAllowed() throws Exception {
        // Seed the job to delete
        ClusterJob job = new ClusterJob();
        job.setId(new ClusterJobPK(nodeId, taskId));
        job.setClusterNode(clusterNodeRepository.findById(nodeId).orElseThrow());
        job.setClusterTask(clusterTaskRepository.findById(taskId).orElseThrow());
        job.setPriority(1);
        job.setEnabled(true);
        clusterJobRepository.save(job);

        mockMvc.perform(delete("/api/v1/administration/cluster/nodes/" + nodeId + "/jobs/" + taskId)
                        .header("Authorization", "Bearer " + token("CLUSTER_NODE_WRITE")))
                .andExpect(status().isNoContent());

        assertThat(clusterJobRepository.existsById(new ClusterJobPK(nodeId, taskId))).isFalse();
    }

    // =====================================================================
    // Repository ordering by priority
    // =====================================================================

    @Test
    void findByClusterNodeIdOrderByPriorityAsc_returnsJobsOrderedByPriority() {
        ClusterTask extraTask1 = clusterTaskRepository.save(newTask("ORDER-TASK-1"));
        ClusterTask extraTask2 = clusterTaskRepository.save(newTask("ORDER-TASK-2"));

        clusterJobRepository.save(seedJob(nodeId, extraTask1, 3));
        clusterJobRepository.save(seedJob(nodeId, taskId, 1));
        clusterJobRepository.save(seedJob(nodeId, extraTask2.getId(), 2));

        List<ClusterJob> jobs = clusterJobRepository.findByClusterNodeIdOrderByPriorityAsc(nodeId);

        assertThat(jobs).hasSize(3);
        assertThat(jobs).extracting(ClusterJob::getPriority).containsExactly(1, 2, 3);
    }

    private ClusterTask newTask(String name) {
        ClusterTask task = new ClusterTask();
        task.setName(name);
        task.setDescription(name);
        task.setNodes(1);
        task.setMinNodes(1);
        return task;
    }

    private ClusterJob seedJob(Long nodeId, Long taskId, int priority) {
        ClusterJob job = new ClusterJob();
        job.setId(new ClusterJobPK(nodeId, taskId));
        job.setClusterNode(clusterNodeRepository.findById(nodeId).orElseThrow());
        job.setClusterTask(clusterTaskRepository.findById(taskId).orElseThrow());
        job.setPriority(priority);
        job.setEnabled(true);
        return job;
    }

    private ClusterJob seedJob(Long nodeId, ClusterTask task, int priority) {
        ClusterJob job = new ClusterJob();
        job.setId(new ClusterJobPK(nodeId, task.getId()));
        job.setClusterNode(clusterNodeRepository.findById(nodeId).orElseThrow());
        job.setClusterTask(task);
        job.setPriority(priority);
        job.setEnabled(true);
        return job;
    }
}
