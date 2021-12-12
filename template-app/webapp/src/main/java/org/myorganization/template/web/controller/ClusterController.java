package org.myorganization.template.web.controller;

import org.myorganization.template.core.domain.system.cluster.ClusterNode;
import org.myorganization.template.core.domain.system.cluster.ClusterNodeCriteria;
import org.myorganization.template.core.services.system.ClusterNodeService;
import org.myorganization.template.web.controller.base.TemplateController;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/cluster")
public class ClusterController extends TemplateControllerBase<ClusterNode, ClusterNodeCriteria> implements TemplateController<ClusterNode, ClusterNodeCriteria>{

	@Autowired
	public ClusterController(ClusterNodeService clusterNodeService) {
		super(clusterNodeService);
	}
	
}
