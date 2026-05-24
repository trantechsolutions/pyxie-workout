import type { Line } from '../store/types';

// ADR-0007: snapshot rows from the constellation API carry only the minimal
// visual subset needed to render via <Sprite />. This adapter normalises that
// payload into the Sprite component's prop shape; unknown lines fall through
// to 'ember' so a buggy server payload still renders something recognisable
// rather than crashing the pane.

export interface SnapshotLike {
  line: string;
  stage: number;
  lineage_id: string;
  sprite_state: Record<string, unknown>;
}

export interface SpriteAdapterProps {
  line: Line;
  stage: number;
  lineageId: string;
  seed?: number;
}

const KNOWN_LINES: ReadonlyArray<Line> = [
  'ember', 'tide', 'verdant', 'gale', 'stone', 'umbra', 'aurora', 'static',
];

function coerceLine(line: string): Line {
  return (KNOWN_LINES as readonly string[]).includes(line) ? (line as Line) : 'ember';
}

export function spriteFromSnapshot(snap: SnapshotLike): SpriteAdapterProps {
  const seed = typeof snap.sprite_state?.seed === 'number'
    ? (snap.sprite_state.seed as number)
    : undefined;
  return {
    line: coerceLine(snap.line),
    stage: Math.max(0, Math.min(4, Math.floor(snap.stage))),
    lineageId: snap.lineage_id,
    seed,
  };
}
