/**
 * Input intent layer. Renderer/controller code reads a stable `MoveIntent`; input *sources*
 * (keyboard+pointer now; gamepad/touch later) write into it. This is the seam that keeps the
 * camera code ignorant of the input device — add a source without touching movement.
 */

export interface MoveIntent {
  forward: number; // -1..1
  strafe: number; // -1..1 (right positive)
  sprint: boolean;
  /** accumulated look deltas (radians) consumed + zeroed each frame by the controller */
  dyaw: number;
  dpitch: number;
  /** edge-triggered interact ("press-X"); consumed by the interaction system */
  interact: boolean;
}

export function createIntent(): MoveIntent {
  return { forward: 0, strafe: 0, sprint: false, dyaw: 0, dpitch: 0, interact: false };
}

export interface InputSource {
  attach(el: HTMLElement, intent: MoveIntent): void;
  detach(): void;
}

/** Keyboard (WASD/arrows, shift=sprint, E/Space=interact) + pointer-lock mouse look. */
export class KeyboardPointerSource implements InputSource {
  private el: HTMLElement | null = null;
  private intent: MoveIntent | null = null;
  private readonly down = new Set<string>();
  private readonly lookSpeed = 0.0022;

  attach(el: HTMLElement, intent: MoveIntent): void {
    this.el = el;
    this.intent = intent;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    el.addEventListener("click", this.requestLock);
    document.addEventListener("mousemove", this.onMouseMove);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.el?.removeEventListener("click", this.requestLock);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.el = null;
    this.intent = null;
    this.down.clear();
  }

  private requestLock = (): void => {
    // Already locked → nothing to do (a redundant request during lock also rejects).
    if (!this.el || document.pointerLockElement === this.el) return;
    // Chrome rejects requestPointerLock() with "cannot be acquired immediately after the user has
    // exited the lock" if you re-request within ~1s of exiting (e.g. Esc to use the code overlay,
    // then click the canvas). That rejection is BENIGN — the next click succeeds — but as an
    // unhandled promise rejection it would trip the global handler and show the fatal boot overlay.
    // Swallow it (both the Promise form and the older synchronous-throw form).
    try {
      const p = this.el.requestPointerLock?.() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* older browsers throw synchronously; ignore */
    }
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    this.down.add(e.code);
    if (e.code === "KeyE" || e.code === "Space") {
      if (this.intent) this.intent.interact = true;
    }
    this.sync();
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
    this.sync();
  };

  private readonly onMouseMove = (e: MouseEvent): void => {
    if (!this.intent || document.pointerLockElement !== this.el) return;
    this.intent.dyaw -= e.movementX * this.lookSpeed;
    this.intent.dpitch -= e.movementY * this.lookSpeed;
  };

  private sync(): void {
    if (!this.intent) return;
    const d = this.down;
    const f =
      (d.has("KeyW") || d.has("ArrowUp") ? 1 : 0) - (d.has("KeyS") || d.has("ArrowDown") ? 1 : 0);
    const s =
      (d.has("KeyD") || d.has("ArrowRight") ? 1 : 0) -
      (d.has("KeyA") || d.has("ArrowLeft") ? 1 : 0);
    this.intent.forward = f;
    this.intent.strafe = s;
    this.intent.sprint = d.has("ShiftLeft") || d.has("ShiftRight");
  }
}
