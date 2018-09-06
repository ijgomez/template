package org.myorganization.template.cluster;

import java.net.UnknownHostException;
import java.time.LocalDateTime;

import org.myorganization.template.cluster.helper.ClusterHelper;
import org.myorganization.template.core.domain.system.cluster.ClusterNode;
import org.myorganization.template.core.domain.system.cluster.ClusterNodeStatus;
import org.myorganization.template.core.services.system.ClusterNodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("clusterManager")
public class ClusterManager {

	private static final Logger LOGGER = LoggerFactory.getLogger(ClusterManager.class);
	
	@Autowired
	private ClusterNodeService clusterNodeService;
	
	//@Lock(type="CLUSTER")
	public void valiteNode() {
		ClusterNode currentNode;
		
		try {
			LOGGER.info("Validating NODE status ...");
					
			currentNode = this.currentNode();
			currentNode.setIp(ClusterHelper.getLocalIp());
			currentNode.setLastUpdateTime(LocalDateTime.now());
			currentNode.setStatus(ClusterNodeStatus.ALIVE);
			currentNode.setTotalMemory(Runtime.getRuntime().maxMemory());
			currentNode.setUsedMemory(Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory());
			
			// TODO Auto-generated catch block
			
			this.clusterNodeService.saveOrUpdate(currentNode);
			
		} catch (UnknownHostException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        
		
	}

	private ClusterNode currentNode() throws UnknownHostException {
		ClusterNode clusterNode;
		String hostName;
		
		hostName = ClusterHelper.getLocalHostName();
		
		clusterNode = this.clusterNodeService.findByHostName(hostName);
		if (clusterNode == null) {
			LOGGER.warn("This node of the cluster ({}) is not registered. It self-registers!", hostName);
			clusterNode = new ClusterNode();
			clusterNode.setHostname(hostName);
			clusterNode.setStartDatetime(LocalDateTime.now());
		}
		return clusterNode;
	}
	
}
