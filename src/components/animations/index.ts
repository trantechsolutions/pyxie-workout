import type { ComponentType } from 'react';
import type { MovementPattern } from '../../store/types';
import type { AnimationSize } from './AnimationBase';
import { PushAnimation } from './PushAnimation';
import { SquatAnimation } from './SquatAnimation';
import { LungeAnimation } from './LungeAnimation';
import { HingeAnimation } from './HingeAnimation';
import { PlankHoldAnimation } from './PlankHoldAnimation';
import { PlankDynamicAnimation } from './PlankDynamicAnimation';
import { CoreDynamicAnimation } from './CoreDynamicAnimation';
import { JumpAnimation } from './JumpAnimation';
import { TwistAnimation } from './TwistAnimation';
import { StretchMobilityAnimation } from './StretchMobilityAnimation';
import { HoldAnimation } from './HoldAnimation';
import { BurpeeAnimation } from './BurpeeAnimation';

export type AnimationComponent = ComponentType<{ size?: AnimationSize }>;

// Compile-time exhaustiveness: every MovementPattern must have an entry.
export const ANIMATION_REGISTRY: Record<MovementPattern, AnimationComponent> = {
  push: PushAnimation,
  squat: SquatAnimation,
  lunge: LungeAnimation,
  hinge: HingeAnimation,
  plank_hold: PlankHoldAnimation,
  plank_dynamic: PlankDynamicAnimation,
  core_dynamic: CoreDynamicAnimation,
  jump: JumpAnimation,
  twist: TwistAnimation,
  stretch_mobility: StretchMobilityAnimation,
  hold: HoldAnimation,
  burpee: BurpeeAnimation,
};

export function getAnimationComponent(pattern: MovementPattern): AnimationComponent {
  return ANIMATION_REGISTRY[pattern];
}

export type { AnimationSize };
