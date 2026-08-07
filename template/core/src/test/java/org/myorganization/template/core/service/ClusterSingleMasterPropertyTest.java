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
 * Property-based test for the single master node invariant.
 *
 * <p><b>Validates: Requirements 23.4, 29.4</b></p>
 *
 * <p>Property 11: For any sequence of setMaster operations,
 * at most one node has master=true at any time.</p>
 */
class ClusterSingleMasterPropertyTest {

    @Property(tries = 50)
    void setMasterEnsuresSingleMaster(@ForAll("nodeCountAndTarget") int[] config) {
        int nodeCount = config[0];
        int targetIndex = config[1];

        ClusterNodeRepository nodeRepository = Mockito.mock(ClusterNodeRepository.class);
        ClusterBlockRepository blockRepository = Mockito.mock(ClusterBlockRepository.class);
        ClusterService clusterService = new ClusterService(nodeRepository, blockRepository);

        List<ClusterNode> nodes = new ArrayList<>();
        for (int i = 0; i < nodeCount; i++) {
            ClusterNode node = new ClusterNode();
            node.setId((long) (i + 1));
            node.setHostname("node-" + (i + 1));
            node.setStatus(NodeStatus.ACTIVE);
            node.setMaster(i == 0);
            nodes.add(node);
        }

        Long targetId = (long) (targetIndex + 1);
        ClusterNode targetNode = nodes.get(targetIndex);

        when(nodeRepository.findById(targetId)).thenReturn(Optional.of(targetNode));
        doAnswer(inv -> { nodes.forEach(n -> n.setMaster(false)); return null; })
                .when(nodeRepository).deactivateAllMasters();
        when(nodeRepository.save(any(ClusterNode.class))).thenAnswer(inv -> inv.getArgument(0));

        clusterService.setMaster(targetId);

        long masterCount = nodes.stream().filter(ClusterNode::isMaster).count();
        assertThat(masterCount).as("Exactly one master after setMaster(%d)", targetId).isEqualTo(1);
        assertThat(targetNode.isMaster()).isTrue();
    }

    @Property(tries = 30)
    void multipleSetMasterCallsMaintainInvariant(@ForAll("setMasterSequence") List<Integer> sequence) {
        int nodeCount = 5;

        ClusterNodeRepository nodeRepository = Mockito.mock(ClusterNodeRepository.class);
        ClusterBlockRepository blockRepository = Mockito.mock(ClusterBlockRepository.class);
        ClusterService clusterService = new ClusterService(nodeRepository, blockRepository);

        List<ClusterNode> nodes = new ArrayList<>();
        for (int i = 0; i < nodeCount; i++) {
            ClusterNode node = new ClusterNode();
            node.setId((long) (i + 1));
            node.setHostname("node-" + (i + 1));
            node.setStatus(NodeStatus.ACTIVE);
            node.setMaster(i == 0);
            nodes.add(node);
        }

        doAnswer(inv -> { nodes.forEach(n -> n.setMaster(false)); return null; })
                .when(nodeRepository).deactivateAllMasters();
        when(nodeRepository.save(any(ClusterNode.class))).thenAnswer(inv -> inv.getArgument(0));

        for (int targetIndex : sequence) {
            Long targetId = (long) (targetIndex + 1);
            when(nodeRepository.findById(targetId)).thenReturn(Optional.of(nodes.get(targetIndex)));
            clusterService.setMaster(targetId);

            long masterCount = nodes.stream().filter(ClusterNode::isMaster).count();
            assertThat(masterCount).as("Invariant after setMaster(%d)", targetId).isEqualTo(1);
        }
    }

    @Provide
    Arbitrary<int[]> nodeCountAndTarget() {
        return Arbitraries.integers().between(2, 10).flatMap(count ->
                Arbitraries.integers().between(0, count - 1).map(target -> new int[]{count, target}));
    }

    @Provide
    Arbitrary<List<Integer>> setMasterSequence() {
        return Arbitraries.integers().between(0, 4).list().ofMinSize(2).ofMaxSize(10);
    }
}
