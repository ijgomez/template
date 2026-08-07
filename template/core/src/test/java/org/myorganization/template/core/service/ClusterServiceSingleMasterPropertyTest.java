package org.myorganization.template.core.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.mockito.Mockito;
import org.myorganization.template.core.repository.ClusterBlockRepository;
import org.myorganization.template.core.repository.ClusterNodeRepository;
import org.myorganization.template.domain.entity.ClusterNode;
import org.myorganization.template.domain.enums.NodeStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

/**
 * Property-based test verifying the single master node invariant.
 *
 * <p><b>Validates: Requirements 23.4, 29.4</b></p>
 *
 * <p>Property 11: For any sequence of setMaster operations, exactly one node
 * has master=true at any point in time.</p>
 */
class ClusterServiceSingleMasterPropertyTest {

    @Property
    void singleMasterInvariantHoldsAfterAnySetMasterSequence(
            @ForAll("clusterConfigurations") ClusterConfiguration config) {

        // Set up in-memory state
        List<ClusterNode> nodes = config.nodes();
        List<Integer> masterSequence = config.masterSequence();

        // Set up mocks
        ClusterNodeRepository clusterNodeRepository = Mockito.mock(ClusterNodeRepository.class);
        ClusterBlockRepository clusterBlockRepository = Mockito.mock(ClusterBlockRepository.class);

        ClusterService clusterService = new ClusterService(clusterNodeRepository, clusterBlockRepository);

        // Mock findById to return node from in-memory list
        when(clusterNodeRepository.findById(any(Long.class))).thenAnswer(invocation -> {
            Long id = invocation.getArgument(0);
            return nodes.stream()
                    .filter(n -> n.getId().equals(id))
                    .findFirst();
        });

        // Mock deactivateAllMasters to set master=false on ALL nodes
        doAnswer(invocation -> {
            for (ClusterNode node : nodes) {
                node.setMaster(false);
            }
            return null;
        }).when(clusterNodeRepository).deactivateAllMasters();

        // Mock save to update the node in the list (identity-based, already in list)
        when(clusterNodeRepository.save(any(ClusterNode.class))).thenAnswer(invocation -> {
            ClusterNode saved = invocation.getArgument(0);
            return saved;
        });

        // Execute setMaster operations and verify invariant after each
        for (Integer index : masterSequence) {
            Long nodeId = nodes.get(index).getId();

            clusterService.setMaster(nodeId);

            // Verify: exactly one node has master=true
            long masterCount = nodes.stream()
                    .filter(n -> Boolean.TRUE.equals(n.getMaster()))
                    .count();
            assertThat(masterCount)
                    .as("Exactly one node must be master after setMaster(%d)", nodeId)
                    .isEqualTo(1L);

            // Verify: the master node is the one just set
            Optional<ClusterNode> masterNode = nodes.stream()
                    .filter(n -> Boolean.TRUE.equals(n.getMaster()))
                    .findFirst();
            assertThat(masterNode).isPresent();
            assertThat(masterNode.get().getId())
                    .as("The master node must be the one just designated")
                    .isEqualTo(nodeId);
        }
    }

    @Provide
    Arbitrary<ClusterConfiguration> clusterConfigurations() {
        Arbitrary<Integer> clusterSizes = Arbitraries.integers().between(2, 10);

        return clusterSizes.flatMap(size -> {
            // Generate a sequence of master indices (1-20 operations)
            Arbitrary<List<Integer>> sequences = Arbitraries.integers()
                    .between(0, size - 1)
                    .list()
                    .ofMinSize(1)
                    .ofMaxSize(20);

            return sequences.map(masterSequence -> {
                List<ClusterNode> nodes = createNodes(size);
                return new ClusterConfiguration(nodes, masterSequence);
            });
        });
    }

    private List<ClusterNode> createNodes(int size) {
        List<ClusterNode> nodes = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            ClusterNode node = new ClusterNode();
            node.setId((long) (i + 1));
            node.setHostname("node-" + (i + 1));
            node.setIp("192.168.1." + (i + 1));
            node.setStatus(NodeStatus.ACTIVE);
            node.setMaster(false);
            nodes.add(node);
        }
        return nodes;
    }

    /**
     * Configuration record holding the cluster state and operation sequence.
     */
    record ClusterConfiguration(List<ClusterNode> nodes, List<Integer> masterSequence) {
    }
}
