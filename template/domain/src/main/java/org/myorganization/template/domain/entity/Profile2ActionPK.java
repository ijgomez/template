package org.myorganization.template.domain.entity;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

/**
 * Composite primary key for Profile2Action (profile_id + action_id).
 */
@Embeddable
@Getter
@Setter
@EqualsAndHashCode
public class Profile2ActionPK implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "profile_id")
    private Long profileId;

    @Column(name = "action_id")
    private Long actionId;

    public Profile2ActionPK() {
    }

    public Profile2ActionPK(Long profileId, Long actionId) {
        this.profileId = profileId;
        this.actionId = actionId;
    }
}
