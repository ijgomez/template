package org.myorganization.template.core.services.system;

import java.util.List;

import org.myorganization.template.core.domain.system.cluster.ClusterNode;
import org.myorganization.template.core.domain.system.cluster.ClusterNodeCriteria;
import org.myorganization.template.core.domain.system.cluster.ClusterNodeRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClusterNodeService extends TemplateServiceBase<ClusterNode, ClusterNodeCriteria> implements TemplateService<ClusterNode, ClusterNodeCriteria> {
	
	@Autowired
	public ClusterNodeService(ClusterNodeRepository clusterNodeRepository) {
		super(clusterNodeRepository);
	}
	
	@Transactional(readOnly = true)
	public List<ClusterNode> findByCriteria(ClusterNodeCriteria criteria) {
		return ((ClusterNodeRepository) super.getRepository()).findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ClusterNodeCriteria criteria) {
		return ((ClusterNodeRepository) super.getRepository()).countByCriteria(criteria);
	}
	
	@Transactional
	public ClusterNode update(Long id, ClusterNode clusterNode) {
		return this.read(id).map(cn -> {
			
			cn.setHostname(clusterNode.getHostname());
			cn.setIp(clusterNode.getIp());
			cn.setStatus(clusterNode.getStatus());
			cn.setLastUpdateTime(clusterNode.getLastUpdateTime());
			cn.setStartDatetime(clusterNode.getStartDatetime());
			cn.setTotalMemory(clusterNode.getTotalMemory());
			cn.setUsedMemory(clusterNode.getUsedMemory());
			
			return super.getRepository().save(cn);
		}).orElseGet(() -> null);
	}
	
	@Transactional
	public ClusterNode findByHostName(String hostname) {
		return ((ClusterNodeRepository) super.getRepository()).findByHostname(hostname);
	}

	@Transactional
	public void saveOrUpdate(ClusterNode clusterNode) {
		if (clusterNode.getId() != null) {
			this.update(clusterNode.getId(), clusterNode);
		} else {
			this.create(clusterNode);
		}
	}
}
