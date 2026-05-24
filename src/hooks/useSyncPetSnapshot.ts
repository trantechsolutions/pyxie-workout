import { useEffect, useRef } from 'react';
import { usePyxie } from '../store/usePyxie';
import { syncPetSnapshot, type PetSnapshotPayload } from '../lib/familyApi';

// ADR-0007: pushes the user's pet visual state to /api/pet-snapshot so other
// family members can render it in the constellation. Mounted once in App.tsx;
// no-ops for users who aren't signed in / aren't in a family. Egg state is
// encoded as `lineage_id = ''` (matches petSlice convention), letting the
// constellation pane decide whether to render <EggSprite/> or <Sprite/>.
//
// Push triggers: whenever the snapshot payload changes. A small in-memory
// signature dedupes back-to-back identical pushes (e.g. during a hot-reload
// or a no-op store rebroadcast).
export function useSyncPetSnapshot(): void {
  const pet = usePyxie((s) => s.pet);
  const inFamily = usePyxie((s) => s.inFamily);
  const lastPushedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!inFamily || !pet) return;
    const snap: PetSnapshotPayload = {
      line: pet.line,
      stage: pet.stage,
      // Egg snapshots intentionally carry empty lineage_id so the family pane
      // can distinguish "still an egg" from "hatched pyxie" without needing
      // workoutsToHatch on the wire.
      lineage_id: pet.workoutsToHatch > 0 ? '' : pet.lineageId,
      sprite_state: {},
    };
    const key = JSON.stringify(snap);
    if (key === lastPushedRef.current) return;
    lastPushedRef.current = key;
    void syncPetSnapshot(snap).catch(() => { /* non-blocking */ });
  }, [pet, inFamily]);
}
