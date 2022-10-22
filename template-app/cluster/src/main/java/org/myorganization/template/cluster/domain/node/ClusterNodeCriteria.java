package org.myorganization.template.cluster.domain.node;

import org.myorganization.template.cluster.enums.ClusterNodeStatus;
import org.myorganization.template.core.domain.base.Criteria;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class ClusterNodeCriteria extends Criteria {

	private String ip;
	
	private String hostname;
	
	private ClusterNodeStatus status;
	
}
