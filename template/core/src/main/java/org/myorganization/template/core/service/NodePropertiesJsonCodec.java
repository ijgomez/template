package org.myorganization.template.core.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

/**
 * Converts node property maps to and from JSON text. Stateless and pure.
 * Uses its own Jackson 2.x {@link ObjectMapper}, independent of the Spring context.
 */
public final class NodePropertiesJsonCodec {

    /** Maximum length (characters) of the serialized JSON. */
    public static final int MAX_JSON_LENGTH = 1_048_576;

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);

    private static final TypeReference<Map<String, String>> MAP_TYPE = new TypeReference<>() { };

    private NodePropertiesJsonCodec() {
    }

    /**
     * Serializes the map to JSON with keys sorted.
     *
     * @return the JSON, or empty if the map is null, serialization fails or the
     *         result exceeds {@link #MAX_JSON_LENGTH}
     */
    public static Optional<String> toJson(Map<String, String> properties) {
        if (properties == null) {
            return Optional.empty();
        }
        try {
            String json = MAPPER.writeValueAsString(properties);
            return json.length() > MAX_JSON_LENGTH ? Optional.empty() : Optional.of(json);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /**
     * Parses a JSON object with text values.
     *
     * @return the map, or an empty map if the input is null, invalid, not an
     *         object, or contains non-text values
     */
    public static Map<String, String> fromJson(String json) {
        if (json == null) {
            return Map.of();
        }
        try {
            JsonNode root = MAPPER.readTree(json);
            if (root == null || !root.isObject()) {
                return Map.of();
            }
            for (JsonNode value : root) {
                if (!value.isTextual() && !value.isNull()) {
                    return Map.of();
                }
            }
            return new LinkedHashMap<>(MAPPER.convertValue(root, MAP_TYPE));
        } catch (Exception e) {
            return Map.of();
        }
    }
}
