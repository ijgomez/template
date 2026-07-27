package org.myorganization.template.domain.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

/**
 * Join table entity representing the many-to-many relationship between Profile and Action.
 */
@Entity
@Table(name = "profile2action")
public class Profile2Action {

    @EmbeddedId
    private Profile2ActionPK id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("profileId")
    @JoinColumn(name = "profile_id")
    private Profile profile;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("actionId")
    @JoinColumn(name = "action_id")
    private Action action;

    public Profile2Action() {
    }

    public Profile2Action(Profile profile, Action action) {
        this.profile = profile;
        this.action = action;
        this.id = new Profile2ActionPK(profile.getId(), action.getId());
    }

    public Profile2ActionPK getId() {
        return id;
    }

    public void setId(Profile2ActionPK id) {
        this.id = id;
    }

    public Profile getProfile() {
        return profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
    }

    public Action getAction() {
        return action;
    }

    public void setAction(Action action) {
        this.action = action;
    }
}
