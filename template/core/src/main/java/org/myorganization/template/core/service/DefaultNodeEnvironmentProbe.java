package org.myorganization.template.core.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.FileStore;
import java.nio.file.Files;
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
        Path path = Path.of("").toAbsolutePath();
        File workingDir = path.toFile();
        return new FileSystemSpace(
                workingDir.getTotalSpace(),
                workingDir.getFreeSpace(),
                workingDir.getUsableSpace(),
                describeFileSystem(path));
    }

    /**
     * Describes the filesystem holding the path as "device (type) - path"; falls back to the
     * path alone when the store cannot be read.
     */
    private String describeFileSystem(Path path) {
        try {
            FileStore store = Files.getFileStore(path);
            return "%s (%s) - %s".formatted(store.name(), store.type(), path);
        } catch (IOException | RuntimeException e) {
            return path.toString();
        }
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
