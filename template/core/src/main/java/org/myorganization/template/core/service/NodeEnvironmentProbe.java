package org.myorganization.template.core.service;

import java.util.Map;

/**
 * Reads environment information of the local node (processors, filesystem space,
 * JVM properties and environment variables).
 * <p>
 * Abstracted so that {@link ClusterService} can be tested with controlled readings.
 */
public interface NodeEnvironmentProbe {

    /**
     * @return number of processors available to the JVM
     */
    int availableProcessors();

    /**
     * @return space of the partition of the working directory
     * @throws RuntimeException if the filesystem cannot be read
     */
    FileSystemSpace fileSystemSpace();

    /**
     * @return JVM system properties, keys and values as text
     */
    Map<String, String> jvmProperties();

    /**
     * @return operating system environment variables
     */
    Map<String, String> environmentVariables();

    /**
     * Filesystem space in bytes.
     *
     * @param total  total space
     * @param free   free space
     * @param usable usable space for this JVM
     * @param filesystem description of the filesystem read (device, type and path); may be null
     */
    record FileSystemSpace(long total, long free, long usable, String filesystem) {

        public FileSystemSpace(long total, long free, long usable) {
            this(total, free, usable, null);
        }
    }
}
