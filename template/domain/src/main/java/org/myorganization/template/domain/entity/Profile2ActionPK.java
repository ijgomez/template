package org.myorganization.template.domain.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Composite primary key for Profile2Action (profile_id + action_id).
 */
@Embeddable
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

    public Long getProfileId() {
        return profileId;
    }

    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }

    public Long getActionId() {
        return actionId;
    }

    public void setActionId(Long actionId) {
        this.actionId = actionId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Profile2ActionPK that = (Profile2ActionPK) o;
        return Objects.equals(profileId, that.profileId)
                && Objects.equals(actionId, that.actionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(profileId, actionId);
    }
}
