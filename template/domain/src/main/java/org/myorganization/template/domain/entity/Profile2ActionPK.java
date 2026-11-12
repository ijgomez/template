package org.myorganization.template.domain.entity;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

/**
 * Composite primary key for Profile2Action (profile_fk + action_fk).
 */
@Embeddable
@Getter
@Setter
@EqualsAndHashCode
public class Profile2ActionPK implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "profile_fk")
    private Long profileId;

    @Column(name = "action_fk")
    private Long actionId;

    public Profile2ActionPK() {
    }

    public Profile2ActionPK(Long profileId, Long actionId) {
        this.profileId = profileId;
        this.actionId = actionId;
    }
}
