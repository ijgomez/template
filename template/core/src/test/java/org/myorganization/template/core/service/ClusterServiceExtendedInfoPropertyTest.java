package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.LongRange;
import net.jqwik.api.constraints.Size;
import net.jqwik.api.constraints.StringLength;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.domain.dto.ClusterNodeDTO;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.enums.NodeStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Property-based tests for the extended node information persisted by
 * {@link ClusterService#registerNode()}.
 *
 * <p><b>Validates: Requirements 1.2, 1.5, 2.2, 3.2, 3.3, 4.5</b></p>
 */
class ClusterServiceExtendedInfoPropertyTest {

    private static final String[] SENSITIVE_KEY_PATTERNS = {
            "app.PassWord.%d", "db.passwd.%d", "x.SECRET.%d", "auth.Token.%d",
            "api.KEY.%d", "user.credential.%d", "jwt.%d"
    };

    private static final class Fixture {
        final ClusterNodeRepository repository = Mockito.mock(ClusterNodeRepository.class);
        final AuditService auditService = Mockito.mock(AuditService.class);
        final NodeEnvironmentProbe probe = Mockito.mock(NodeEnvironmentProbe.class);
        final ClusterService service = new ClusterService(
                repository, Mockito.mock(ClusterBlockRepository.class), auditService, probe);
    }

    /** Builds a map with plain entries and sensitive entries whose values are unique. */
    private static Map<String, String> buildProperties(List<Integer> plainValues, int sensitiveCount,
                                                       List<String> sensitiveValues) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < plainValues.size(); i++) {
            map.put("plain." + i, "v" + plainValues.get(i));
        }
        for (int i = 0; i < sensitiveCount; i++) {
            String key = String.format(SENSITIVE_KEY_PATTERNS[i % SENSITIVE_KEY_PATTERNS.length], i);
            String value = "SECRET-" + UUID.randomUUID();
            map.put(key, value);
            sensitiveValues.add(value);
        }
        return map;
    }

    // Feature: cluster-node-extended-info, Property 6: El registro persiste datos enmascarados
    // y sustituye los anteriores
    @Property(tries = 100)
    void registerNodePersistsMaskedDataReplacingPrevious(
            @ForAll boolean existing,
            @ForAll @Size(max = 8) List<@IntRange(min = 0, max = 1000) Integer> jvmPlain,
            @ForAll @IntRange(min = 0, max = 6) int jvmSensitive,
            @ForAll @Size(max = 8) List<@IntRange(min = 0, max = 1000) Integer> envPlain,
            @ForAll @IntRange(min = 0, max = 6) int envSensitive,
            @ForAll @IntRange(min = 1, max = 256) int processors,
            @ForAll @LongRange(min = 0, max = Long.MAX_VALUE / 2) long total,
            @ForAll @LongRange(min = 0, max = Long.MAX_VALUE / 2) long free,
            @ForAll @LongRange(min = 0, max = Long.MAX_VALUE / 2) long usable,
            @ForAll @StringLength(max = 30) String previousJson) {

        // given
        Fixture f = new Fixture();
        List<String> secrets = new java.util.ArrayList<>();
        Map<String, String> jvm = buildProperties(jvmPlain, jvmSensitive, secrets);
        Map<String, String> env = buildProperties(envPlain, envSensitive, secrets);

        when(f.probe.availableProcessors()).thenReturn(processors);
        when(f.probe.fileSystemSpace()).thenReturn(new NodeEnvironmentProbe.FileSystemSpace(total, free, usable));
        when(f.probe.jvmProperties()).thenReturn(jvm);
        when(f.probe.environmentVariables()).thenReturn(env);

        if (existing) {
            ClusterNode node = new ClusterNode();
            node.setId(1L);
            node.setProcessors(1);
            node.setJvmProperties("{\"old.jvm.key\":\"" + previousJson.replace("\"", "") + "\"}");
            node.setEnvironmentProperties("{\"old.env.key\":\"old\"}");
            when(f.repository.findByHostname(anyString())).thenReturn(Optional.of(node));
        } else {
            when(f.repository.findByHostname(anyString())).thenReturn(Optional.empty());
            when(f.repository.save(any(ClusterNode.class))).thenAnswer(inv -> {
                ClusterNode n = inv.getArgument(0);
                n.setId(2L);
                return n;
            });
        }

        // when
        f.service.registerNode();

        // then
        ArgumentCaptor<ClusterNode> captor = ArgumentCaptor.forClass(ClusterNode.class);
        verify(f.repository).save(captor.capture());
        ClusterNode saved = captor.getValue();

        String expectedJvm = NodePropertiesJsonCodec.toJson(SensitivePropertyMasker.mask(jvm)).orElse(null);
        String expectedEnv = NodePropertiesJsonCodec.toJson(SensitivePropertyMasker.mask(env)).orElse(null);

        assertThat(saved.getJvmProperties()).isEqualTo(expectedJvm);
        assertThat(saved.getEnvironmentProperties()).isEqualTo(expectedEnv);
        assertThat(saved.getJvmProperties()).doesNotContain("old.jvm.key");
        assertThat(saved.getEnvironmentProperties()).doesNotContain("old.env.key");
        assertThat(saved.getProcessors()).isEqualTo(processors);
        assertThat(saved.getFsTotalSpace()).isEqualTo(total);
        assertThat(saved.getFsFreeSpace()).isEqualTo(free);
        assertThat(saved.getFsUsableSpace()).isEqualTo(usable);
        for (String secret : secrets) {
            assertThat(saved.getJvmProperties()).doesNotContain(secret);
            assertThat(saved.getEnvironmentProperties()).doesNotContain(secret);
        }
    }

    // Feature: cluster-node-extended-info, Property 7: Un número de procesadores inválido
    // no altera el nodo
    @Property(tries = 100)
    void invalidProcessorCountKeepsPreviousOrFailsWithoutPersisting(
            @ForAll @IntRange(min = Integer.MIN_VALUE, max = 0) int invalidProcessors,
            @ForAll boolean existing,
            @ForAll boolean hasPreviousProcessors,
            @ForAll @IntRange(min = 1, max = 256) int previousProcessors) {

        // given
        Fixture f = new Fixture();
        when(f.probe.availableProcessors()).thenReturn(invalidProcessors);
        when(f.probe.fileSystemSpace()).thenReturn(new NodeEnvironmentProbe.FileSystemSpace(10L, 5L, 4L));
        when(f.probe.jvmProperties()).thenReturn(Map.of("a", "b"));
        when(f.probe.environmentVariables()).thenReturn(Map.of("c", "d"));

        boolean hasPrevious = existing && hasPreviousProcessors;
        if (existing) {
            ClusterNode node = new ClusterNode();
            node.setId(1L);
            node.setProcessors(hasPrevious ? previousProcessors : null);
            when(f.repository.findByHostname(anyString())).thenReturn(Optional.of(node));
        } else {
            when(f.repository.findByHostname(anyString())).thenReturn(Optional.empty());
            when(f.repository.save(any(ClusterNode.class))).thenAnswer(inv -> {
                ClusterNode n = inv.getArgument(0);
                n.setId(2L);
                return n;
            });
        }

        if (hasPrevious) {
            // when
            f.service.registerNode();

            // then
            ArgumentCaptor<ClusterNode> captor = ArgumentCaptor.forClass(ClusterNode.class);
            verify(f.repository).save(captor.capture());
            assertThat(captor.getValue().getProcessors()).isEqualTo(previousProcessors);
        } else {
            // when / then
            assertThatThrownBy(f.service::registerNode)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("processor");
            verify(f.repository, never()).save(any(ClusterNode.class));
        }
    }

    // Feature: cluster-node-extended-info, Property 8: El heartbeat actualiza solo el Filesystem
    // y no audita
    // Validates: Requirements 1.3, 2.3, 3.4, 9.2, 9.6, 9.7
    @Property(tries = 100)
    void heartbeatUpdatesOnlyFilesystemAndDoesNotAudit(
            @ForAll @net.jqwik.api.constraints.WithNull(0.2) @IntRange(min = 1, max = 256) Integer processors,
            @ForAll @net.jqwik.api.constraints.WithNull(0.2) @StringLength(max = 40) String jvmJson,
            @ForAll @net.jqwik.api.constraints.WithNull(0.2) @StringLength(max = 40) String envJson,
            @ForAll @net.jqwik.api.constraints.WithNull(0.2) @LongRange(min = 0, max = Long.MAX_VALUE / 2) Long oldTotal,
            @ForAll @net.jqwik.api.constraints.WithNull(0.2) @LongRange(min = 0, max = Long.MAX_VALUE / 2) Long oldFree,
            @ForAll @net.jqwik.api.constraints.WithNull(0.2) @LongRange(min = 0, max = Long.MAX_VALUE / 2) Long oldUsable,
            @ForAll @LongRange(min = 0, max = Long.MAX_VALUE / 2) long total,
            @ForAll @LongRange(min = 0, max = Long.MAX_VALUE / 2) long free,
            @ForAll @LongRange(min = 0, max = Long.MAX_VALUE / 2) long usable) {

        // given
        Fixture f = new Fixture();
        ClusterNode node = new ClusterNode();
        node.setId(1L);
        node.setProcessors(processors);
        node.setJvmProperties(jvmJson);
        node.setEnvironmentProperties(envJson);
        node.setFsTotalSpace(oldTotal);
        node.setFsFreeSpace(oldFree);
        node.setFsUsableSpace(oldUsable);
        when(f.repository.findByHostname(anyString())).thenReturn(Optional.of(node));
        when(f.probe.fileSystemSpace()).thenReturn(new NodeEnvironmentProbe.FileSystemSpace(total, free, usable));

        // when: one heartbeat
        f.service.heartbeat();

        // then
        assertThat(node.getFsTotalSpace()).isEqualTo(total);
        assertThat(node.getFsFreeSpace()).isEqualTo(free);
        assertThat(node.getFsUsableSpace()).isEqualTo(usable);
        assertThat(node.getProcessors()).isEqualTo(processors);
        assertThat(node.getJvmProperties()).isEqualTo(jvmJson);
        assertThat(node.getEnvironmentProperties()).isEqualTo(envJson);
        Mockito.verifyNoInteractions(f.auditService);

        // when: nine more heartbeats, ten consecutive in total
        for (int i = 0; i < 9; i++) {
            f.service.heartbeat();
        }

        // then
        assertThat(node.getFsTotalSpace()).isEqualTo(total);
        assertThat(node.getFsFreeSpace()).isEqualTo(free);
        assertThat(node.getFsUsableSpace()).isEqualTo(usable);
        assertThat(node.getProcessors()).isEqualTo(processors);
        assertThat(node.getJvmProperties()).isEqualTo(jvmJson);
        assertThat(node.getEnvironmentProperties()).isEqualTo(envJson);
        Mockito.verifyNoInteractions(f.auditService);
    }

    /**
     * Builds a stored node. {@code infoMode}: 0 = new fields null, 1 = informed.
     * {@code jsonMode}: 0 = valid JSON, 1 = null, 2 = invalid JSON.
     */
    private static ClusterNode buildStoredNode(long id, int infoMode, int jsonMode, int seed) {
        ClusterNode node = new ClusterNode();
        node.setId(id);
        node.setStatus(seed % 2 == 0 ? NodeStatus.ACTIVE : NodeStatus.INACTIVE);
        node.setHostname("host-" + id + "-" + seed);
        node.setIp("10.0." + (seed % 256) + "." + (id % 256));
        node.setMaster(seed % 3 == 0);
        node.setUsedMemory((long) seed * 3);
        node.setFreeMemory((long) seed * 5);
        node.setTotalMemory((long) seed * 8);
        node.setStartedAt(OffsetDateTime.parse("2025-01-01T00:00:00Z").plusMinutes(seed));
        node.setLastModifiedAt(OffsetDateTime.parse("2025-06-01T00:00:00Z").plusMinutes(seed));
        if (infoMode == 1) {
            node.setProcessors(1 + seed % 64);
            node.setFsTotalSpace(1000L + seed);
            node.setFsFreeSpace(500L + seed);
            node.setFsUsableSpace(400L + seed);
        }
        String json = switch (jsonMode) {
            case 0 -> NodePropertiesJsonCodec
                    .toJson(Map.of("k" + seed, "v" + seed, "other", "x"))
                    .orElse(null);
            case 1 -> null;
            default -> "{not valid json " + seed;
        };
        node.setJvmProperties(json);
        node.setEnvironmentProperties(jsonMode == 2 ? "[1,2" : json);
        return node;
    }

    // Feature: cluster-node-extended-info, Property 9: El DTO de detalle refleja el nodo almacenado
    // Validates: Requirements 1.4, 1.6, 2.6, 3.5, 3.8, 5.1, 5.5, 5.6
    @Property(tries = 100)
    void findNodeByIdDtoReflectsStoredNode(
            @ForAll @IntRange(min = 0, max = 1) int infoMode,
            @ForAll @IntRange(min = 0, max = 2) int jsonMode,
            @ForAll @IntRange(min = 0, max = 100000) int seed) {

        // given
        Fixture f = new Fixture();
        ClusterNode node = buildStoredNode(7L, infoMode, jsonMode, seed);
        when(f.repository.findById(7L)).thenReturn(Optional.of(node));

        // when
        ClusterNodeDTO dto = f.service.findNodeById(7L);

        // then
        assertThat(dto.id()).isEqualTo(node.getId());
        assertThat(dto.status()).isEqualTo(node.getStatus());
        assertThat(dto.hostname()).isEqualTo(node.getHostname());
        assertThat(dto.ip()).isEqualTo(node.getIp());
        assertThat(dto.master()).isEqualTo(node.getMaster());
        assertThat(dto.usedMemory()).isEqualTo(node.getUsedMemory());
        assertThat(dto.freeMemory()).isEqualTo(node.getFreeMemory());
        assertThat(dto.totalMemory()).isEqualTo(node.getTotalMemory());
        assertThat(dto.startedAt()).isEqualTo(node.getStartedAt());
        assertThat(dto.lastModifiedAt()).isEqualTo(node.getLastModifiedAt());
        assertThat(dto.processors()).isEqualTo(node.getProcessors());
        assertThat(dto.fsTotalSpace()).isEqualTo(node.getFsTotalSpace());
        assertThat(dto.fsFreeSpace()).isEqualTo(node.getFsFreeSpace());
        assertThat(dto.fsUsableSpace()).isEqualTo(node.getFsUsableSpace());
        assertThat(dto.jvmProperties()).isEqualTo(NodePropertiesJsonCodec.fromJson(node.getJvmProperties()));
        assertThat(dto.environmentProperties())
                .isEqualTo(NodePropertiesJsonCodec.fromJson(node.getEnvironmentProperties()));
        if (jsonMode != 0) {
            assertThat(dto.jvmProperties()).isEmpty();
            assertThat(dto.environmentProperties()).isEmpty();
        }
    }

    // Feature: cluster-node-extended-info, Property 10: La lista no incluye los campos nuevos
    // Validates: Requirements 5.2, 5.3, 5.6
    @Property(tries = 100)
    void findAllNodesDtosOmitNewFields(
            @ForAll @Size(max = 6) List<@IntRange(min = 0, max = 5) Integer> modes,
            @ForAll @IntRange(min = 0, max = 100000) int seed) {

        // given
        Fixture f = new Fixture();
        List<ClusterNode> nodes = new java.util.ArrayList<>();
        for (int i = 0; i < modes.size(); i++) {
            int mode = modes.get(i);
            nodes.add(buildStoredNode(i + 1L, mode % 2, mode % 3, seed + i));
        }
        when(f.repository.findAll()).thenReturn(nodes);

        // when
        List<ClusterNodeDTO> result = f.service.findAllNodes();

        // then
        assertThat(result).hasSize(nodes.size());
        for (int i = 0; i < nodes.size(); i++) {
            ClusterNode node = nodes.get(i);
            ClusterNodeDTO dto = result.get(i);
            assertThat(dto.id()).isEqualTo(node.getId());
            assertThat(dto.status()).isEqualTo(node.getStatus());
            assertThat(dto.hostname()).isEqualTo(node.getHostname());
            assertThat(dto.ip()).isEqualTo(node.getIp());
            assertThat(dto.master()).isEqualTo(node.getMaster());
            assertThat(dto.usedMemory()).isEqualTo(node.getUsedMemory());
            assertThat(dto.freeMemory()).isEqualTo(node.getFreeMemory());
            assertThat(dto.totalMemory()).isEqualTo(node.getTotalMemory());
            assertThat(dto.startedAt()).isEqualTo(node.getStartedAt());
            assertThat(dto.lastModifiedAt()).isEqualTo(node.getLastModifiedAt());
            assertThat(dto.processors()).isNull();
            assertThat(dto.fsTotalSpace()).isNull();
            assertThat(dto.fsFreeSpace()).isNull();
            assertThat(dto.fsUsableSpace()).isNull();
            assertThat(dto.jvmProperties()).isNull();
            assertThat(dto.environmentProperties()).isNull();
        }
    }
}
