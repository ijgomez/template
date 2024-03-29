package org.myorganization.template.cluster.service;

import java.util.List;

import org.myorganization.template.cluster.domain.node.ClusterNode;
import org.myorganization.template.cluster.domain.node.ClusterNodeCriteria;
import org.myorganization.template.cluster.domain.node.ClusterNodeRepository;
import org.myorganization.template.core.services.base.TemplateServiceBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClusterNodeService extends TemplateServiceBase<ClusterNode, ClusterNodeCriteria> {
	
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
			
			cn.setIp(clusterNode.getIp());		
			cn.setHostname(clusterNode.getHostname());
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
