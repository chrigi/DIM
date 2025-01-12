import React from 'react';
import { DimStore } from 'app/inventory/store-types';
import { DestinyProfileResponse, DestinyMilestone } from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import WellRestedPerkIcon from './WellRestedPerkIcon';
import { Milestone } from './Milestone';
import _ from 'lodash';

/**
 * The list of Milestones for a character. Milestones are different from pursuits and
 * represent challenges, story prompts, and other stuff you can do not represented by Pursuits.
 */
export default function Milestones({
  profileInfo,
  store,
  defs
}: {
  store: DimStore;
  profileInfo: DestinyProfileResponse;
  defs: D2ManifestDefinitions;
}) {
  const profileMilestones = milestonesForProfile(defs, profileInfo, store.id);
  const characterProgressions = profileInfo.characterProgressions.data || {};

  return (
    <div className="progress-for-character">
      <WellRestedPerkIcon defs={defs} progressions={characterProgressions[store.id]} />
      {profileMilestones.map((milestone) => (
        <Milestone
          milestone={milestone}
          characterClass={store.classType}
          defs={defs}
          key={milestone.milestoneHash}
        />
      ))}
      {milestonesForCharacter(defs, profileInfo, store).map((milestone) => (
        <Milestone
          milestone={milestone}
          characterClass={store.classType}
          defs={defs}
          key={milestone.milestoneHash}
        />
      ))}
    </div>
  );
}

/**
 * Get all the milestones that are valid across the whole profile. This still requires a character (any character)
 * to look them up, and the assumptions underlying this may get invalidated as the game evolves.
 */
function milestonesForProfile(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
  characterId: string
): DestinyMilestone[] {
  const allMilestones: DestinyMilestone[] = profileInfo.characterProgressions.data
    ? Object.values(profileInfo.characterProgressions.data[characterId].milestones)
    : [];

  const filteredMilestones = allMilestones.filter((milestone) => {
    return (
      !milestone.availableQuests &&
      !milestone.activities &&
      (milestone.vendors || milestone.rewards) &&
      defs &&
      defs.Milestone.get(milestone.milestoneHash)
    );
  });

  return _.sortBy(filteredMilestones, (milestone) => milestone.order);
}

/**
 * Get all the milestones to show for a particular character, filtered to active milestones and sorted.
 */
function milestonesForCharacter(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
  character: DimStore
): DestinyMilestone[] {
  const allMilestones: DestinyMilestone[] =
    profileInfo.characterProgressions &&
    profileInfo.characterProgressions.data &&
    profileInfo.characterProgressions.data[character.id]
      ? Object.values(profileInfo.characterProgressions.data[character.id].milestones)
      : [];

  const filteredMilestones = allMilestones.filter((milestone) => {
    const def = defs && defs.Milestone.get(milestone.milestoneHash);
    return (
      def &&
      (def.showInExplorer || def.showInMilestones) &&
      (milestone.activities ||
        (milestone.availableQuests &&
          milestone.availableQuests.every(
            (q) =>
              q.status.stepObjectives.length > 0 &&
              q.status.started &&
              (!q.status.completed || !q.status.redeemed)
          )))
    );
  });

  return _.sortBy(filteredMilestones, (milestone) => milestone.order);
}
