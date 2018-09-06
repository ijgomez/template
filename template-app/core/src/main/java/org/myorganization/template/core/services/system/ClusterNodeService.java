package org.myorganization.template.core.services.system;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.myorganization.template.core.domain.system.cluster.ClusterNode;
import org.myorganization.template.core.domain.system.cluster.ClusterNodeCriteria;
import org.myorganization.template.core.domain.system.cluster.ClusterNodeRepository;
import org.myorganization.template.core.services.base.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClusterNodeService implements TemplateService<ClusterNode, ClusterNodeCriteria> {
	
	@Autowired
	private ClusterNodeRepository clusterNodeRepository;
	
	@Transactional(readOnly = true)
	public List<ClusterNode> findAll() {
		return StreamSupport.stream(this.clusterNodeRepository.findAll().spliterator(), false).collect(Collectors.toList());
	}
	
	@Transactional(readOnly = true)
	public List<ClusterNode> findByCriteria(ClusterNodeCriteria criteria) {
		return this.clusterNodeRepository.findByCriteria(criteria);
	}
	
	@Transactional(readOnly = true)
	public Long countByCriteria(ClusterNodeCriteria criteria) {
		return this.clusterNodeRepository.countByCriteria(criteria);
	}
	
	@Transactional
	public ClusterNode create(ClusterNode clusterNode) {
		return this.clusterNodeRepository.save(clusterNode);
	}
	
	@Transactional(readOnly = true)
	public Optional<ClusterNode> read(Long id) {
		return this.clusterNodeRepository.findById(id);
	}
	
	@Transactional
	public ClusterNode update(Long id, ClusterNode clusterNode) {
		Optional<ClusterNode> optional = this.read(id);
		if (optional.isPresent()) {
			ClusterNode cn = optional.get();
			cn.setHostname(clusterNode.getHostname());
			cn.setIp(clusterNode.getIp());
			cn.setStatus(clusterNode.getStatus());
			cn.setLastUpdateTime(clusterNode.getLastUpdateTime());
			cn.setStartDatetime(clusterNode.getStartDatetime());
			cn.setTotalMemory(clusterNode.getTotalMemory());
			cn.setUsedMemory(clusterNode.getUsedMemory());
			
			return this.clusterNodeRepository.save(cn);
		} 
		//TODO Not Found Exception....
		return null;
	}
	
	@Transactional
	public Long delete(Long id) {
		this.clusterNodeRepository.deleteById(id);
		return id;
	}

	@Transactional
	public ClusterNode findByHostName(String hostname) {
		return this.clusterNodeRepository.findByHostname(hostname);
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
