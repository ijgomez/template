package org.myorganization.template.core.service;

import java.net.InetAddress;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.AbstractMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.LoggerFactory;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.domain.criteria.ClusterBlockCriteria;
import org.myorganization.template.domain.dto.ClusterBlockDTO;
import org.myorganization.template.domain.dto.ClusterNodeDTO;
import org.myorganization.template.domain.entity.ClusterBlock;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.enums.NodeStatus;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClusterServiceTest {

    @Mock
    private ClusterNodeRepository clusterNodeRepository;

    @Mock
    private ClusterBlockRepository clusterBlockRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private NodeEnvironmentProbe environmentProbe;

    private ClusterService clusterService;

    @BeforeEach
    void setUp() {
        clusterService = new ClusterService(clusterNodeRepository, clusterBlockRepository, auditService, environmentProbe);
    }

    // =====================================================================
    // Node operations
    // =====================================================================

    @Nested
    @DisplayName("findAllNodes")
    class FindAllNodes {

        @Test
        @DisplayName("returns all nodes as DTOs")
        void returnsAllNodesAsDTOs() {
            ClusterNode node1 = createNode(1L, "host1", NodeStatus.ACTIVE, true);
            ClusterNode node2 = createNode(2L, "host2", NodeStatus.INACTIVE, false);

            when(clusterNodeRepository.findAll()).thenReturn(List.of(node1, node2));

            List<ClusterNodeDTO> result = clusterService.findAllNodes();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(1L);
            assertThat(result.get(0).hostname()).isEqualTo("host1");
            assertThat(result.get(0).status()).isEqualTo(NodeStatus.ACTIVE);
            assertThat(result.get(0).master()).isTrue();
            assertThat(result.get(1).id()).isEqualTo(2L);
            assertThat(result.get(1).hostname()).isEqualTo("host2");
            assertThat(result.get(1).status()).isEqualTo(NodeStatus.INACTIVE);
        }

        @Test
        @DisplayName("returns empty list when no nodes exist")
        void returnsEmptyListWhenNoNodes() {
            when(clusterNodeRepository.findAll()).thenReturn(List.of());

            List<ClusterNodeDTO> result = clusterService.findAllNodes();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findNodeById")
    class FindNodeById {

        @Test
        @DisplayName("existing node returns ClusterNodeDTO")
        void existingNodeReturnsDTO() {
            ClusterNode node = createNode(1L, "host1", NodeStatus.ACTIVE, true);
            when(clusterNodeRepository.findById(1L)).thenReturn(Optional.of(node));

            ClusterNodeDTO result = clusterService.findNodeById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.hostname()).isEqualTo("host1");
            assertThat(result.status()).isEqualTo(NodeStatus.ACTIVE);
            assertThat(result.master()).isTrue();
        }

        @Test
        @DisplayName("non-existing node throws EntityNotFoundException")
        void nonExistingNodeThrowsException() {
            when(clusterNodeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterService.findNodeById(999L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterNode")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("setMaster")
    class SetMaster {

        @Test
        @DisplayName("deactivates all masters and sets target as master")
        void deactivatesAllMastersAndSetsTarget() {
            ClusterNode node = createNode(2L, "host2", NodeStatus.ACTIVE, false);
            when(clusterNodeRepository.findById(2L)).thenReturn(Optional.of(node));
            when(clusterNodeRepository.save(any(ClusterNode.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ClusterNodeDTO result = clusterService.setMaster(2L);

            verify(clusterNodeRepository).deactivateAllMasters();
            assertThat(result.master()).isTrue();
            assertThat(result.id()).isEqualTo(2L);
        }

        @Test
        @DisplayName("throws EntityNotFoundException when node does not exist")
        void throwsExceptionWhenNodeNotFound() {
            when(clusterNodeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterService.setMaster(999L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterNode")
                    .hasMessageContaining("999");

            verify(clusterNodeRepository, never()).deactivateAllMasters();
        }
    }

    @Nested
    @DisplayName("detectDeadNodes")
    class DetectDeadNodes {

        @Test
        @DisplayName("marks nodes with old lastModifiedAt as INACTIVE")
        void marksOldNodesAsInactive() {
            ClusterNode staleNode = createNode(1L, "host1", NodeStatus.ACTIVE, false);
            staleNode.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(10));

            when(clusterNodeRepository.findByStatusAndLastModifiedAtBefore(
                    eq(NodeStatus.ACTIVE), any(OffsetDateTime.class)))
                    .thenReturn(List.of(staleNode));
            when(clusterNodeRepository.save(any(ClusterNode.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            clusterService.detectDeadNodes();

            ArgumentCaptor<ClusterNode> captor = ArgumentCaptor.forClass(ClusterNode.class);
            verify(clusterNodeRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(NodeStatus.INACTIVE);
        }

        @Test
        @DisplayName("does nothing when no stale nodes found")
        void doesNothingWhenNoStaleNodes() {
            when(clusterNodeRepository.findByStatusAndLastModifiedAtBefore(
                    eq(NodeStatus.ACTIVE), any(OffsetDateTime.class)))
                    .thenReturn(List.of());

            clusterService.detectDeadNodes();

            verify(clusterNodeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("electMaster")
    class ElectMaster {

        @Test
        @DisplayName("elects first ACTIVE node when no master exists")
        void electsFirstActiveNodeWhenNoMaster() {
            ClusterNode candidate = createNode(1L, "host1", NodeStatus.ACTIVE, false);

            when(clusterNodeRepository.findByMasterTrueAndStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(List.of());
            when(clusterNodeRepository.findFirstByStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(Optional.of(candidate));
            when(clusterNodeRepository.save(any(ClusterNode.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            clusterService.electMaster();

            verify(clusterNodeRepository).deactivateAllMasters();
            ArgumentCaptor<ClusterNode> captor = ArgumentCaptor.forClass(ClusterNode.class);
            verify(clusterNodeRepository).save(captor.capture());
            assertThat(captor.getValue().getMaster()).isTrue();
        }

        @Test
        @DisplayName("elects the current node when the previous master is no longer ACTIVE")
        void electsCurrentNodeWhenMasterDead() throws Exception {
            String hostname = java.net.InetAddress.getLocalHost().getHostName();
            ClusterNode self = createNode(2L, hostname, NodeStatus.ACTIVE, false);

            when(clusterNodeRepository.findByMasterTrueAndStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(List.of());
            when(clusterNodeRepository.findByHostname(hostname)).thenReturn(Optional.of(self));
            when(clusterNodeRepository.save(any(ClusterNode.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            clusterService.electMaster();

            verify(clusterNodeRepository).deactivateAllMasters();
            assertThat(self.getMaster()).isTrue();
            verify(clusterNodeRepository, never()).findFirstByStatusOrderByIdAsc(any());
        }

        @Test
        @DisplayName("does nothing when an ACTIVE master already exists")
        void doesNothingWhenMasterExists() {
            ClusterNode master = createNode(1L, "host1", NodeStatus.ACTIVE, true);

            when(clusterNodeRepository.findByMasterTrueAndStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(List.of(master));

            clusterService.electMaster();

            verify(clusterNodeRepository, never()).deactivateAllMasters();
            verify(clusterNodeRepository, never()).save(any());
        }

        @Test
        @DisplayName("demotes duplicate masters keeping the lowest id")
        void demotesDuplicateMasters() {
            ClusterNode first = createNode(1L, "host1", NodeStatus.ACTIVE, true);
            ClusterNode second = createNode(2L, "host2", NodeStatus.ACTIVE, true);
            when(clusterNodeRepository.findByMasterTrueAndStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(List.of(first, second));
            clusterService.electMaster();
            assertThat(first.getMaster()).isTrue();
            assertThat(second.getMaster()).isFalse();
            verify(clusterNodeRepository).save(second);
            verify(clusterNodeRepository, never()).deactivateAllMasters();
        }
        @Test
        @DisplayName("does nothing when no ACTIVE nodes available")
        void doesNothingWhenNoActiveNodes() {
            when(clusterNodeRepository.findByMasterTrueAndStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(List.of());
            when(clusterNodeRepository.findFirstByStatusOrderByIdAsc(NodeStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            clusterService.electMaster();

            verify(clusterNodeRepository, never()).deactivateAllMasters();
            verify(clusterNodeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Node method restrictions")
    class NodeMethodRestrictions {

        @Test
        @DisplayName("createNode throws MethodNotAllowedException")
        void createNodeThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.createNode(null))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("creation is not allowed");
        }

        @Test
        @DisplayName("deleteNode throws MethodNotAllowedException")
        void deleteNodeThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.deleteNode(1L))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("deletion is not allowed");
        }
    }

    // =====================================================================
    // Block operations
    // =====================================================================

    @Nested
    @DisplayName("findBlocksByCriteria")
    class FindBlocksByCriteria {

        @Test
        @DisplayName("returns paginated results")
        void returnsPaginatedResults() {
            ClusterBlock block = createBlock(1L, "NODOS", 150L, 100L, 200L, 10L);
            Page<ClusterBlock> page = new PageImpl<>(List.of(block), PageRequest.of(0, 10), 1);
            ClusterBlockCriteria criteria = new ClusterBlockCriteria(null);
            Pageable pageable = PageRequest.of(0, 10);

            when(clusterBlockRepository.findAll(ArgumentMatchers.<Specification<ClusterBlock>>any(), eq(pageable))).thenReturn(page);

            Page<ClusterBlockDTO> result = clusterService.findBlocksByCriteria(criteria, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).name()).isEqualTo("NODOS");
        }
    }

    @Nested
    @DisplayName("countBlocksByCriteria")
    class CountBlocksByCriteria {

        @Test
        @DisplayName("returns total count matching criteria")
        void returnsCount() {
            ClusterBlockCriteria criteria = new ClusterBlockCriteria("NODOS");
            when(clusterBlockRepository.count(ArgumentMatchers.<Specification<ClusterBlock>>any())).thenReturn(3L);

            long count = clusterService.countBlocksByCriteria(criteria);

            assertThat(count).isEqualTo(3L);
        }
    }

    @Nested
    @DisplayName("findBlockById")
    class FindBlockById {

        @Test
        @DisplayName("existing block returns ClusterBlockDTO")
        void existingBlockReturnsDTO() {
            ClusterBlock block = createBlock(1L, "NODOS", 150L, 100L, 200L, 10L);
            when(clusterBlockRepository.findById(1L)).thenReturn(Optional.of(block));

            ClusterBlockDTO result = clusterService.findBlockById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.name()).isEqualTo("NODOS");
            assertThat(result.avgTime()).isEqualTo(150L);
            assertThat(result.minTime()).isEqualTo(100L);
            assertThat(result.maxTime()).isEqualTo(200L);
            assertThat(result.total()).isEqualTo(10L);
        }

        @Test
        @DisplayName("non-existing block throws EntityNotFoundException")
        void nonExistingBlockThrowsException() {
            when(clusterBlockRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clusterService.findBlockById(999L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ClusterBlock")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("Block method restrictions")
    class BlockMethodRestrictions {

        @Test
        @DisplayName("createBlock throws MethodNotAllowedException")
        void createBlockThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.createBlock(null))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("creation is not allowed");
        }

        @Test
        @DisplayName("updateBlock throws MethodNotAllowedException")
        void updateBlockThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.updateBlock(1L, null))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("update is not allowed");
        }

        @Test
        @DisplayName("deleteBlock throws MethodNotAllowedException")
        void deleteBlockThrowsMethodNotAllowed() {
            assertThatThrownBy(() -> clusterService.deleteBlock(1L))
                    .isInstanceOf(MethodNotAllowedException.class)
                    .hasMessageContaining("deletion is not allowed");
        }
    }

    // =====================================================================
    // Extended node information
    // =====================================================================

    @Nested
    @DisplayName("extended node info")
    class ExtendedInfo {

        private static final String SECRET_VALUE = "s3cr3t-value-XYZ";
        private static final String PLAIN_VALUE = "plain-value-ABC";

        private String hostname;
        private ListAppender<ILoggingEvent> appender;
        private Logger serviceLogger;
        private Level previousLevel;

        @BeforeEach
        void setUpLogs() throws Exception {
            hostname = InetAddress.getLocalHost().getHostName();
            serviceLogger = (Logger) LoggerFactory.getLogger(ClusterService.class);
            previousLevel = serviceLogger.getLevel();
            serviceLogger.setLevel(Level.DEBUG);
            appender = new ListAppender<>();
            appender.start();
            serviceLogger.addAppender(appender);
        }

        @AfterEach
        void tearDownLogs() {
            serviceLogger.detachAppender(appender);
            serviceLogger.setLevel(previousLevel);
        }

        private void stubProbe(int processors, NodeEnvironmentProbe.FileSystemSpace fs) {
            lenient().when(environmentProbe.availableProcessors()).thenReturn(processors);
            lenient().when(environmentProbe.fileSystemSpace()).thenReturn(fs);
            lenient().when(environmentProbe.jvmProperties()).thenReturn(
                    new LinkedHashMap<>(Map.of("java.version", "21", "db.password", SECRET_VALUE)));
            lenient().when(environmentProbe.environmentVariables()).thenReturn(
                    new LinkedHashMap<>(Map.of("HOME", PLAIN_VALUE, "API_TOKEN", SECRET_VALUE)));
        }

        private ClusterNode registerNewAndCapture() {
            when(clusterNodeRepository.findByHostname(hostname)).thenReturn(Optional.empty());
            when(clusterNodeRepository.save(any(ClusterNode.class))).thenAnswer(inv -> {
                ClusterNode n = inv.getArgument(0);
                n.setId(10L);
                return n;
            });
            clusterService.registerNode();
            ArgumentCaptor<ClusterNode> captor = ArgumentCaptor.forClass(ClusterNode.class);
            verify(clusterNodeRepository).save(captor.capture());
            return captor.getValue();
        }

        private String allLogs() {
            return appender.list.stream().map(ILoggingEvent::getFormattedMessage)
                    .reduce("", (a, b) -> a + "\n" + b);
        }

        @Test
        @DisplayName("registerNode creates a new node with processors, filesystem, JVM and env properties")
        void registerNewNodeLoadsExtendedInfo() {
            stubProbe(8, new NodeEnvironmentProbe.FileSystemSpace(1000L, 400L, 300L, "overlay (overlay) - /opt/app"));

            ClusterNode saved = registerNewAndCapture();

            assertThat(saved.getProcessors()).isEqualTo(8);
            assertThat(saved.getFsTotalSpace()).isEqualTo(1000L);
            assertThat(saved.getFsFreeSpace()).isEqualTo(400L);
            assertThat(saved.getFsUsableSpace()).isEqualTo(300L);
            assertThat(saved.getFilesystem()).isEqualTo("overlay (overlay) - /opt/app");
            Map<String, String> jvm = NodePropertiesJsonCodec.fromJson(saved.getJvmProperties());
            Map<String, String> env = NodePropertiesJsonCodec.fromJson(saved.getEnvironmentProperties());
            assertThat(jvm).containsEntry("java.version", "21")
                    .containsEntry("db.password", SensitivePropertyMasker.MASKED_VALUE);
            assertThat(env).containsEntry("HOME", PLAIN_VALUE)
                    .containsEntry("API_TOKEN", SensitivePropertyMasker.MASKED_VALUE);
            assertThat(saved.getJvmProperties()).doesNotContain(SECRET_VALUE);
            assertThat(saved.getEnvironmentProperties()).doesNotContain(SECRET_VALUE);
        }

        @Test
        @DisplayName("registerNode on an existing node replaces previous extended info")
        void registerExistingNodeReplacesExtendedInfo() {
            stubProbe(4, new NodeEnvironmentProbe.FileSystemSpace(2000L, 900L, 800L));
            ClusterNode existing = createNode(5L, hostname, NodeStatus.INACTIVE, false);
            existing.setProcessors(2);
            existing.setFsTotalSpace(1L);
            existing.setJvmProperties("{\"old\":\"x\"}");
            existing.setEnvironmentProperties("{\"old\":\"y\"}");
            when(clusterNodeRepository.findByHostname(hostname)).thenReturn(Optional.of(existing));

            clusterService.registerNode();

            assertThat(existing.getProcessors()).isEqualTo(4);
            assertThat(existing.getFsTotalSpace()).isEqualTo(2000L);
            assertThat(existing.getFsFreeSpace()).isEqualTo(900L);
            assertThat(existing.getFsUsableSpace()).isEqualTo(800L);
            assertThat(NodePropertiesJsonCodec.fromJson(existing.getJvmProperties()))
                    .doesNotContainKey("old").containsEntry("java.version", "21");
            assertThat(NodePropertiesJsonCodec.fromJson(existing.getEnvironmentProperties()))
                    .doesNotContainKey("old").containsEntry("HOME", PLAIN_VALUE);
            verify(clusterNodeRepository).save(existing);
        }

        @Test
        @DisplayName("registerNode with filesystem probe failure nulls only the three filesystem values")
        void registerFilesystemProbeFailure() {
            stubProbe(8, null);
            when(environmentProbe.fileSystemSpace()).thenThrow(new IllegalStateException("boom " + SECRET_VALUE));

            ClusterNode saved = registerNewAndCapture();

            assertThat(saved.getFsTotalSpace()).isNull();
            assertThat(saved.getFsFreeSpace()).isNull();
            assertThat(saved.getFsUsableSpace()).isNull();
            assertThat(saved.getProcessors()).isEqualTo(8);
            assertThat(saved.getJvmProperties()).isNotNull();
            assertThat(saved.getEnvironmentProperties()).isNotNull();
            assertThat(appender.list).anyMatch(e -> e.getLevel() == Level.WARN);
        }

        @Test
        @DisplayName("registerNode with JVM properties probe failure nulls only the JVM column")
        void registerMaskerFailureNullsOnlyAffectedColumn() {
            stubProbe(8, new NodeEnvironmentProbe.FileSystemSpace(1L, 1L, 1L));
            Map<String, String> failing = new AbstractMap<>() {
                @Override
                public Set<Entry<String, String>> entrySet() {
                    throw new IllegalStateException("cannot read " + SECRET_VALUE);
                }
            };
            when(environmentProbe.jvmProperties()).thenReturn(failing);

            ClusterNode saved = registerNewAndCapture();

            assertThat(saved.getJvmProperties()).isNull();
            assertThat(saved.getEnvironmentProperties()).isNotNull();
            assertThat(saved.getProcessors()).isEqualTo(8);
            assertThat(appender.list).anyMatch(e -> e.getLevel() == Level.ERROR);
            assertThat(allLogs()).doesNotContain(SECRET_VALUE).doesNotContain(PLAIN_VALUE);
        }

        @Test
        @DisplayName("registerNode with oversized environment JSON nulls only the environment column")
        void registerSerializerFailureNullsOnlyAffectedColumn() {
            stubProbe(8, new NodeEnvironmentProbe.FileSystemSpace(1L, 1L, 1L));
            String huge = "v".repeat(NodePropertiesJsonCodec.MAX_JSON_LENGTH + 1);
            when(environmentProbe.environmentVariables()).thenReturn(new LinkedHashMap<>(Map.of("BIG", huge)));

            ClusterNode saved = registerNewAndCapture();

            assertThat(saved.getEnvironmentProperties()).isNull();
            assertThat(saved.getJvmProperties()).isNotNull();
            assertThat(appender.list).anyMatch(e -> e.getLevel() == Level.WARN
                    && e.getFormattedMessage().contains("Environment_Properties"));
            assertThat(allLogs()).doesNotContain("vvvvvvvv").doesNotContain(SECRET_VALUE);
        }

        @Test
        @DisplayName("heartbeat updates filesystem and keeps processors and properties")
        void heartbeatUpdatesOnlyFilesystem() {
            stubProbe(99, new NodeEnvironmentProbe.FileSystemSpace(7000L, 3000L, 2500L));
            ClusterNode node = createNode(5L, hostname, NodeStatus.ACTIVE, false);
            node.setProcessors(8);
            node.setFsTotalSpace(1L);
            node.setFsFreeSpace(1L);
            node.setFsUsableSpace(1L);
            node.setJvmProperties("{\"a\":\"b\"}");
            node.setEnvironmentProperties("{\"c\":\"d\"}");
            when(clusterNodeRepository.findByHostname(hostname)).thenReturn(Optional.of(node));

            clusterService.heartbeat();

            assertThat(node.getFsTotalSpace()).isEqualTo(7000L);
            assertThat(node.getFsFreeSpace()).isEqualTo(3000L);
            assertThat(node.getFsUsableSpace()).isEqualTo(2500L);
            assertThat(node.getProcessors()).isEqualTo(8);
            assertThat(node.getJvmProperties()).isEqualTo("{\"a\":\"b\"}");
            assertThat(node.getEnvironmentProperties()).isEqualTo("{\"c\":\"d\"}");
            verify(clusterNodeRepository).save(node);
            verify(environmentProbe, never()).jvmProperties();
            verify(environmentProbe, never()).environmentVariables();
            verify(environmentProbe, never()).availableProcessors();
        }

        @Test
        @DisplayName("heartbeat with filesystem probe failure nulls filesystem, keeps the rest and still saves")
        void heartbeatProbeFailure() {
            ClusterNode node = createNode(5L, hostname, NodeStatus.ACTIVE, false);
            node.setProcessors(8);
            node.setFsTotalSpace(1L);
            node.setFsFreeSpace(1L);
            node.setFsUsableSpace(1L);
            node.setJvmProperties("{\"a\":\"b\"}");
            OffsetDateTime before = OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1);
            node.setLastModifiedAt(before);
            when(clusterNodeRepository.findByHostname(hostname)).thenReturn(Optional.of(node));
            when(environmentProbe.fileSystemSpace()).thenThrow(new IllegalStateException("io"));

            clusterService.heartbeat();

            assertThat(node.getFsTotalSpace()).isNull();
            assertThat(node.getFsFreeSpace()).isNull();
            assertThat(node.getFsUsableSpace()).isNull();
            assertThat(node.getProcessors()).isEqualTo(8);
            assertThat(node.getJvmProperties()).isEqualTo("{\"a\":\"b\"}");
            assertThat(node.getLastModifiedAt()).isAfter(before);
            verify(clusterNodeRepository).save(node);
            assertThat(appender.list).anyMatch(e -> e.getLevel() == Level.WARN);
        }

        @Test
        @DisplayName("10 heartbeats create no audit entries")
        void tenHeartbeatsDoNotAudit() {
            stubProbe(8, new NodeEnvironmentProbe.FileSystemSpace(10L, 5L, 4L));
            ClusterNode node = createNode(5L, hostname, NodeStatus.ACTIVE, false);
            when(clusterNodeRepository.findByHostname(hostname)).thenReturn(Optional.of(node));

            for (int i = 0; i < 10; i++) {
                clusterService.heartbeat();
            }

            verify(clusterNodeRepository, times(10)).save(node);
            verifyNoInteractions(auditService);
        }
    }

    // =====================================================================
    // Helper methods
    // =====================================================================

    private ClusterNode createNode(Long id, String hostname, NodeStatus status, boolean master) {
        ClusterNode node = new ClusterNode();
        node.setId(id);
        node.setHostname(hostname);
        node.setIp("192.168.1." + id);
        node.setStatus(status);
        node.setMaster(master);
        node.setUsedMemory(500_000_000L);
        node.setFreeMemory(300_000_000L);
        node.setTotalMemory(800_000_000L);
        node.setStartedAt(OffsetDateTime.now(ZoneOffset.UTC));
        node.setLastModifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return node;
    }

    private ClusterBlock createBlock(Long id, String name, Long avgTime, Long minTime, Long maxTime, Long total) {
        ClusterBlock block = new ClusterBlock();
        block.setId(id);
        block.setName(name);
        block.setStartDate(OffsetDateTime.now(ZoneOffset.UTC));
        block.setAvgTime(avgTime);
        block.setMinTime(minTime);
        block.setMaxTime(maxTime);
        block.setTotal(total);
        return block;
    }
}
