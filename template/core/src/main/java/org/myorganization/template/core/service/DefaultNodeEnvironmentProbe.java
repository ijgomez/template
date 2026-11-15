package org.myorganization.template.core.service;

import java.io.File;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

/**
 * Default {@link NodeEnvironmentProbe} backed by {@link Runtime}, {@link File} and {@link System}.
 */
@Component
public class DefaultNodeEnvironmentProbe implements NodeEnvironmentProbe {

    @Override
    public int availableProcessors() {
        return Runtime.getRuntime().availableProcessors();
    }

    @Override
    public FileSystemSpace fileSystemSpace() {
        File workingDir = Path.of("").toAbsolutePath().toFile();
        return new FileSystemSpace(
                workingDir.getTotalSpace(),
                workingDir.getFreeSpace(),
                workingDir.getUsableSpace());
    }

    @Override
    public Map<String, String> jvmProperties() {
        var properties = System.getProperties();
        Map<String, String> result = new LinkedHashMap<>();
        for (String name : properties.stringPropertyNames()) {
            result.put(name, properties.getProperty(name));
        }
        return result;
    }

    @Override
    public Map<String, String> environmentVariables() {
        return new LinkedHashMap<>(System.getenv());
    }
}
