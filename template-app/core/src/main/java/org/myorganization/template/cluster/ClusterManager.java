package org.myorganization.template.cluster;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component("clusterManager")
public class ClusterManager {

	private static final Logger LOGGER = LoggerFactory.getLogger(ClusterManager.class);
	
	public void valiteNode() {
		LOGGER.info("Validating NODE status ...");
	}
	
}
