package org.myorganization.template.core.domain.system.cluster;

import java.time.LocalDateTime;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(ClusterNode.class)
@SuppressWarnings({"squid:S1118", "squid:S101", "squid:S3077", "squid:S1104", "squid:S1444"})
public class ClusterNode_ {

	public static volatile SingularAttribute<ClusterNode, Integer> id;
	public static volatile SingularAttribute<ClusterNode, String> hostname;
	public static volatile SingularAttribute<ClusterNode, String> ip;
	public static volatile SingularAttribute<ClusterNode, ClusterNodeStatus> status;
	public static volatile SingularAttribute<ClusterNode, LocalDateTime> startDatetime;
	public static volatile SingularAttribute<ClusterNode, LocalDateTime> lastUpdateTime;
	public static volatile SingularAttribute<ClusterNode, Long> totalMemory;
	public static volatile SingularAttribute<ClusterNode, Long> usedMemory;
	
}
