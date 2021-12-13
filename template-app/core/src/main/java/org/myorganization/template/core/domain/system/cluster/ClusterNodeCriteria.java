package org.myorganization.template.core.domain.system.cluster;

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
