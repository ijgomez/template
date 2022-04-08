package org.myorganization.template.web.controller;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.cluster.domain.node.ClusterNode;
import org.myorganization.template.cluster.domain.node.ClusterNodeCriteria;
import org.myorganization.template.cluster.service.ClusterNodeService;
import org.myorganization.template.web.controller.base.TemplateControllerBase;
import org.myorganization.template.web.domain.datatables.DataTablesCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/cluster/nodes")
public class ClusterController extends TemplateControllerBase<ClusterNode, ClusterNodeCriteria> {

	@Autowired
	public ClusterController(ClusterNodeService clusterNodeService) {
		super(clusterNodeService);
	}
	
	@Override
	protected ClusterNodeCriteria buildCriteria(DataTablesCriteria<ClusterNodeCriteria> dtCriteria) {
		ClusterNodeCriteria criteria;

		criteria = (dtCriteria.getCriteria() != null) ? dtCriteria.getCriteria() : new ClusterNodeCriteria();

		if (StringUtils.isNotEmpty(dtCriteria.getParameters().getSearch().getValue())) {
			criteria.setHostname(dtCriteria.getParameters().getSearch().getValue());
		}

		return criteria;
	}
	
}
