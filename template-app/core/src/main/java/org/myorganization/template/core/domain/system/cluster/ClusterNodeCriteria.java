package org.myorganization.template.core.domain.system.cluster;

import org.myorganization.template.core.domain.base.Criteria;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class ClusterNodeCriteria extends Criteria {

	private String ip;
	
	private String hostname;
	
	private ClusterNodeStatus status;
	
}
