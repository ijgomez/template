package org.myorganization.template.cluster;

import java.net.UnknownHostException;
import java.time.LocalDateTime;

import org.myorganization.template.cluster.domain.ClusterNode;
import org.myorganization.template.cluster.domain.ClusterNodeStatus;
import org.myorganization.template.cluster.helper.ClusterHelper;
import org.myorganization.template.cluster.service.ClusterNodeService;
import org.myorganization.template.core.domain.system.status.Memory;
import org.myorganization.template.core.domain.system.traces.TraceType;
import org.myorganization.template.core.services.system.NotifyService;
import org.myorganization.template.core.services.system.StatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component("clusterManager")
@Slf4j
public class ClusterManager {

	@Autowired
	private ClusterNodeService clusterNodeService;
	
	@Autowired
	private StatusService statusService;
	
	@Autowired
	private NotifyService notifyService;
	
	//@Lock(type="CLUSTER")
	public void valiteNode() {
		Memory memory;
		ClusterNode currentNode;
		
		try {
			log.info("Validating NODE status ...");
			
			memory = this.statusService.getMemory();
					
			currentNode = this.currentNode();
			currentNode.setIp(ClusterHelper.getLocalIp());
			currentNode.setLastUpdateTime(LocalDateTime.now());
			currentNode.setStatus(ClusterNodeStatus.ALIVE);
			currentNode.setTotalMemory(memory.getMax());
			currentNode.setUsedMemory(memory.getUsed());
			
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
			String msg = String.format("This node of the cluster (%s) is not registered. It self-registers!", hostName);
			this.notifyService.notify(TraceType.SYSTEM, msg);
			log.warn(msg);
			clusterNode = new ClusterNode();
			clusterNode.setHostname(hostName);
			clusterNode.setStartDatetime(LocalDateTime.now());
		}
		return clusterNode;
	}
	
}
