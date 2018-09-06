package org.myorganization.template.core.domain.system.cluster;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

@Entity
public class ClusterNode {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cluster_node_seq")
	@SequenceGenerator(name = "cluster_node_seq", sequenceName = "cluster_node_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String ip;
	
	@Column(nullable = false)
	private String hostname;
	
	@Column(nullable = false)
	private LocalDateTime startDatetime;
	
	@Column(nullable = false)
	private LocalDateTime lastUpdateTime;

	@Column(nullable = false)
	private ClusterNodeStatus status;
	
	@Column(nullable = false)
	private Long usedMemory;
	
	@Column(nullable = false)
	private Long totalMemory;
	
	public ClusterNode() {
		super();
	}
	
	public Long getId() {
		return id;
	}
	
	public void setId(Long id) {
		this.id = id;
	}
	
	public String getIp() {
		return ip;
	}

	public void setIp(String ip) {
		this.ip = ip;
	}

	public String getHostname() {
		return hostname;
	}

	public void setHostname(String hostname) {
		this.hostname = hostname;
	}

	public LocalDateTime getStartDatetime() {
		return startDatetime;
	}

	public void setStartDatetime(LocalDateTime startDatetime) {
		this.startDatetime = startDatetime;
	}

	public LocalDateTime getLastUpdateTime() {
		return lastUpdateTime;
	}

	public void setLastUpdateTime(LocalDateTime lastUpdateTime) {
		this.lastUpdateTime = lastUpdateTime;
	}

	public ClusterNodeStatus getStatus() {
		return status;
	}

	public void setStatus(ClusterNodeStatus status) {
		this.status = status;
	}

	public Long getUsedMemory() {
		return usedMemory;
	}

	public void setUsedMemory(Long usedMemory) {
		this.usedMemory = usedMemory;
	}

	public Long getTotalMemory() {
		return totalMemory;
	}

	public void setTotalMemory(Long totalMemory) {
		this.totalMemory = totalMemory;
	}

	@Override
	public int hashCode() {
		return HashCodeBuilder.reflectionHashCode(this, true);
	}

	@Override
	public boolean equals(Object obj) {
		return EqualsBuilder.reflectionEquals(this, obj, true);
	}

	@Override
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}

}
