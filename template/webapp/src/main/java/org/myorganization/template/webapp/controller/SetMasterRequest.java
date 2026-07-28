package org.myorganization.template.webapp.controller;

/**
 * Request body for the PATCH endpoint that updates the master flag of a cluster node.
 *
 * @param master whether the node should be designated as master
 */
public record SetMasterRequest(Boolean master) {
}
