import type { ComponentType } from 'react';
import type { AnimationSize } from './AnimationBase';
import { PlaceholderAnimation } from './PlaceholderAnimation';

// --- per-exercise animation components (1 per exercise, 90 total) ---
import { WallPushUpsAnimation } from './wall-push-ups';
import { BodyweightSquatsAnimation } from './bodyweight-squats';
import { GluteBridgesAnimation } from './glute-bridges';
import { StandingMarchAnimation } from './standing-march';
import { ArmCirclesAnimation } from './arm-circles';
import { CatCowAnimation } from './cat-cow';
import { CalfRaisesAnimation } from './calf-raises';
import { StandingSideBendsAnimation } from './standing-side-bends';
import { SeatedLegExtensionsAnimation } from './seated-leg-extensions';
import { WallSitAnimation } from './wall-sit';

import { InclinePushUpsAnimation } from './incline-push-ups';
import { ReverseLungesAnimation } from './reverse-lunges';
import { BirdDogsAnimation } from './bird-dogs';
import { DeadBugAnimation } from './dead-bug';
import { StepUpsAnimation } from './step-ups';
import { SideLyingLegRaisesAnimation } from './side-lying-leg-raises';
import { StandingKneeToElbowAnimation } from './standing-knee-to-elbow';
import { PlankKneeDropsAnimation } from './plank-knee-drops';
import { GluteBridgeMarchAnimation } from './glute-bridge-march';
import { SumoSquatAnimation } from './sumo-squat';

import { TempoSquats3sDownAnimation } from './tempo-squats-3s-down';
import { HandReleasePushUpsAnimation } from './hand-release-push-ups';
import { SingleLegGluteBridgeAnimation } from './single-leg-glute-bridge';
import { CurtsyLungesAnimation } from './curtsy-lunges';
import { PlankShoulderTapsAnimation } from './plank-shoulder-taps';
import { HollowBodyHoldAnimation } from './hollow-body-hold';
import { SidePlankAnimation } from './side-plank';
import { ReverseSnowAngelsAnimation } from './reverse-snow-angels';
import { StandingKneeDrivesAnimation } from './standing-knee-drives';
import { WallSitCalfRaiseAnimation } from './wall-sit-calf-raise';

import { PushUpsAnimation } from './push-ups';
import { WalkingLungesAnimation } from './walking-lunges';
import { MountainClimbersAnimation } from './mountain-climbers';
import { JumpingJacksAnimation } from './jumping-jacks';
import { PlankHoldAnimation } from './plank-hold';
import { BicycleCrunchesAnimation } from './bicycle-crunches';
import { SquatHoldPulsesAnimation } from './squat-hold-pulses';
import { RussianTwistsAnimation } from './russian-twists';
import { HighKneesAnimation } from './high-knees';
import { PushUpShoulderTapAnimation } from './push-up-shoulder-tap';

import { SquatToStandTempoAnimation } from './squat-to-stand-tempo';
import { TricepDipsChairAnimation } from './tricep-dips-chair';
import { ReverseCrunchesAnimation } from './reverse-crunches';
import { SideLungesAnimation } from './side-lunges';
import { SpiderPlankAnimation } from './spider-plank';
import { LateralHopsAnimation } from './lateral-hops';
import { SingleLegHipHingeAnimation } from './single-leg-hip-hinge';
import { VUpsAnimation } from './v-ups';
import { PlankToDownDogAnimation } from './plank-to-down-dog';
import { ReverseLungeKneeDriveAnimation } from './reverse-lunge-knee-drive';

import { DeclinePushUpsAnimation } from './decline-push-ups';
import { BulgarianSplitSquatAnimation } from './bulgarian-split-squat';
import { PikePushUpsAnimation } from './pike-push-ups';
import { ToeTouchesAnimation } from './toe-touches';
import { PlankToPushUpAnimation } from './plank-to-push-up';
import { CossackSquatsAnimation } from './cossack-squats';
import { HollowBodyRocksAnimation } from './hollow-body-rocks';
import { ArcherPushUpsAnimation } from './archer-push-ups';
import { SingleLegDeadliftNoWeightAnimation } from './single-leg-deadlift-no-weight';
import { SidePlankHipDipsAnimation } from './side-plank-hip-dips';

import { BurpeesAnimation } from './burpees';
import { JumpSquatsAnimation } from './jump-squats';
import { PushUpBurpeeAnimation } from './push-up-burpee';
import { PlankJacksAnimation } from './plank-jacks';
import { TuckJumpsAnimation } from './tuck-jumps';
import { SquatThrustsAnimation } from './squat-thrusts';
import { PlankUpDownsAnimation } from './plank-up-downs';
import { SprawlsAnimation } from './sprawls';
import { SideToSideSkatersAnimation } from './side-to-side-skaters';
import { MountainClimberSprintsAnimation } from './mountain-climber-sprints';

import { PlyometricLungesAnimation } from './plyometric-lunges';
import { DiamondPushUpsAnimation } from './diamond-push-ups';
import { PistolSquatProgressionAnimation } from './pistol-squat-progression';
import { HollowBodyHold2Animation } from './hollow-body-hold-2';
import { BurpeeTuckJumpAnimation } from './burpee-tuck-jump';
import { HandReleasePushUps2Animation } from './hand-release-push-ups-2';
import { PlankToPikeAnimation } from './plank-to-pike';
import { BearCrawlAnimation } from './bear-crawl';
import { SingleLegBurpeeAnimation } from './single-leg-burpee';
import { CrabToeTouchAnimation } from './crab-toe-touch';

import { PseudoPlanchePushUpAnimation } from './pseudo-planche-push-up';
import { PistolSquatsAssistedOkAnimation } from './pistol-squats-assisted-ok';
import { HandstandWallHoldAnimation } from './handstand-wall-hold';
import { PlyoPushUpsAnimation } from './plyo-push-ups';
import { DragonFlagNegativesAnimation } from './dragon-flag-negatives';
import { ShrimpSquatProgressionAnimation } from './shrimp-squat-progression';
import { LSitKneesOkAnimation } from './l-sit-knees-ok';
import { BurpeeBroadJumpAnimation } from './burpee-broad-jump';
import { ArcherPushUpFullAnimation } from './archer-push-up-full';
import { VUpBurpeeAnimation } from './v-up-burpee';

export type AnimationComponent = ComponentType<{ size?: AnimationSize }>;

export const ANIMATION_REGISTRY: Record<string, AnimationComponent> = {
  'wall-push-ups': WallPushUpsAnimation,
  'bodyweight-squats': BodyweightSquatsAnimation,
  'glute-bridges': GluteBridgesAnimation,
  'standing-march': StandingMarchAnimation,
  'arm-circles': ArmCirclesAnimation,
  'cat-cow': CatCowAnimation,
  'calf-raises': CalfRaisesAnimation,
  'standing-side-bends': StandingSideBendsAnimation,
  'seated-leg-extensions': SeatedLegExtensionsAnimation,
  'wall-sit': WallSitAnimation,

  'incline-push-ups': InclinePushUpsAnimation,
  'reverse-lunges': ReverseLungesAnimation,
  'bird-dogs': BirdDogsAnimation,
  'dead-bug': DeadBugAnimation,
  'step-ups': StepUpsAnimation,
  'side-lying-leg-raises': SideLyingLegRaisesAnimation,
  'standing-knee-to-elbow': StandingKneeToElbowAnimation,
  'plank-knee-drops': PlankKneeDropsAnimation,
  'glute-bridge-march': GluteBridgeMarchAnimation,
  'sumo-squat': SumoSquatAnimation,

  'tempo-squats-3s-down': TempoSquats3sDownAnimation,
  'hand-release-push-ups': HandReleasePushUpsAnimation,
  'single-leg-glute-bridge': SingleLegGluteBridgeAnimation,
  'curtsy-lunges': CurtsyLungesAnimation,
  'plank-shoulder-taps': PlankShoulderTapsAnimation,
  'hollow-body-hold': HollowBodyHoldAnimation,
  'side-plank': SidePlankAnimation,
  'reverse-snow-angels': ReverseSnowAngelsAnimation,
  'standing-knee-drives': StandingKneeDrivesAnimation,
  'wall-sit-calf-raise': WallSitCalfRaiseAnimation,

  'push-ups': PushUpsAnimation,
  'walking-lunges': WalkingLungesAnimation,
  'mountain-climbers': MountainClimbersAnimation,
  'jumping-jacks': JumpingJacksAnimation,
  'plank-hold': PlankHoldAnimation,
  'bicycle-crunches': BicycleCrunchesAnimation,
  'squat-hold-pulses': SquatHoldPulsesAnimation,
  'russian-twists': RussianTwistsAnimation,
  'high-knees': HighKneesAnimation,
  'push-up-shoulder-tap': PushUpShoulderTapAnimation,

  'squat-to-stand-tempo': SquatToStandTempoAnimation,
  'tricep-dips-chair': TricepDipsChairAnimation,
  'reverse-crunches': ReverseCrunchesAnimation,
  'side-lunges': SideLungesAnimation,
  'spider-plank': SpiderPlankAnimation,
  'lateral-hops': LateralHopsAnimation,
  'single-leg-hip-hinge': SingleLegHipHingeAnimation,
  'v-ups': VUpsAnimation,
  'plank-to-down-dog': PlankToDownDogAnimation,
  'reverse-lunge-knee-drive': ReverseLungeKneeDriveAnimation,

  'decline-push-ups': DeclinePushUpsAnimation,
  'bulgarian-split-squat': BulgarianSplitSquatAnimation,
  'pike-push-ups': PikePushUpsAnimation,
  'toe-touches': ToeTouchesAnimation,
  'plank-to-push-up': PlankToPushUpAnimation,
  'cossack-squats': CossackSquatsAnimation,
  'hollow-body-rocks': HollowBodyRocksAnimation,
  'archer-push-ups': ArcherPushUpsAnimation,
  'single-leg-deadlift-no-weight': SingleLegDeadliftNoWeightAnimation,
  'side-plank-hip-dips': SidePlankHipDipsAnimation,

  'burpees': BurpeesAnimation,
  'jump-squats': JumpSquatsAnimation,
  'push-up-burpee': PushUpBurpeeAnimation,
  'plank-jacks': PlankJacksAnimation,
  'tuck-jumps': TuckJumpsAnimation,
  'squat-thrusts': SquatThrustsAnimation,
  'plank-up-downs': PlankUpDownsAnimation,
  'sprawls': SprawlsAnimation,
  'side-to-side-skaters': SideToSideSkatersAnimation,
  'mountain-climber-sprints': MountainClimberSprintsAnimation,

  'plyometric-lunges': PlyometricLungesAnimation,
  'diamond-push-ups': DiamondPushUpsAnimation,
  'pistol-squat-progression': PistolSquatProgressionAnimation,
  'hollow-body-hold-2': HollowBodyHold2Animation,
  'burpee-tuck-jump': BurpeeTuckJumpAnimation,
  'hand-release-push-ups-2': HandReleasePushUps2Animation,
  'plank-to-pike': PlankToPikeAnimation,
  'bear-crawl': BearCrawlAnimation,
  'single-leg-burpee': SingleLegBurpeeAnimation,
  'crab-toe-touch': CrabToeTouchAnimation,

  'pseudo-planche-push-up': PseudoPlanchePushUpAnimation,
  'pistol-squats-assisted-ok': PistolSquatsAssistedOkAnimation,
  'handstand-wall-hold': HandstandWallHoldAnimation,
  'plyo-push-ups': PlyoPushUpsAnimation,
  'dragon-flag-negatives': DragonFlagNegativesAnimation,
  'shrimp-squat-progression': ShrimpSquatProgressionAnimation,
  'l-sit-knees-ok': LSitKneesOkAnimation,
  'burpee-broad-jump': BurpeeBroadJumpAnimation,
  'archer-push-up-full': ArcherPushUpFullAnimation,
  'v-up-burpee': VUpBurpeeAnimation,
};

/**
 * Resolve an animationId to its component. Unknown ids fall back to a
 * static placeholder (and log a console.warn in dev) so a typo in data
 * never crashes the render.
 */
export function getAnimationComponent(animationId: string): AnimationComponent {
  const c = ANIMATION_REGISTRY[animationId];
  if (c) return c;
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[animations] no component for id "${animationId}", using placeholder`);
  }
  return PlaceholderAnimation;
}

export { PlaceholderAnimation };
export type { AnimationSize };
