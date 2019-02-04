package org.myorganization.template.core.domain.system.cluster;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(ClusterNode.class)
public class ClusterNode_ {

	public static volatile SingularAttribute<ClusterNode, Integer> id;
	public static volatile SingularAttribute<ClusterNode, String> hostname;
	public static volatile SingularAttribute<ClusterNode, String> ip;
	public static volatile SingularAttribute<ClusterNode, ClusterNodeStatus> status;
	
}
