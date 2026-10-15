// Block definitions, tree helpers and the animation engine.
// `t` lists the block label: strings are text, numbers are input slots (index into block.a).

export const SPEC = {
  move:   { cls: "bg-[#4c97ff]", t: ["move", 0, "steps"], d: [10] },
  turn:   { cls: "bg-[#4c97ff]", t: ["turn ↻", 0, "degrees"], d: [15] },
  goto:   { cls: "bg-[#4c97ff]", t: ["go to x:", 0, "y:", 1], d: [0, 0] },
  say:    { cls: "bg-[#9966ff]", t: ["say", 0, "for", 1, "seconds"], d: ["Hello!", 2] },
  think:  { cls: "bg-[#9966ff]", t: ["think", 0, "for", 1, "seconds"], d: ["Hmm...", 2] },
  repeat: { cls: "bg-[#ffab19]", t: ["repeat", 0, "times"], d: [30] },
};

let uid = 1;
export const newBlock = (type, a) => ({
  id: "b" + uid++,
  type,
  a: a || [...SPEC[type].d],
  c: type === "repeat" ? [] : undefined,
});
export const clone = (o) => JSON.parse(JSON.stringify(o));

// ---- tree helpers (blocks can nest inside `repeat`) ----
export const findBlock = (list, id) => {
  for (const b of list) {
    if (b.id === id) return b;
    if (b.c) { const r = findBlock(b.c, id); if (r) return r; }
  }
};
export const findList = (list, parent) => {
  if (parent === "root") return list;
  for (const b of list) {
    if (b.id === parent) return b.c;
    if (b.c) { const r = findList(b.c, parent); if (r) return r; }
  }
};
export const takeBlock = (list, id) => {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) return list.splice(i, 1)[0];
    if (list[i].c) { const r = takeBlock(list[i].c, id); if (r) return r; }
  }
};

// ---- sprites ----
const EMOJI = ["🐱", "🐶", "🐸", "🦊", "🐼", "🐵"];
const STARTS = [[-150, 0], [150, 0], [0, 110], [0, -110], [-150, 100], [150, -100]];

export const makeSprite = (i, script = []) => ({
  id: "s" + i, name: "Sprite" + (i + 1), emoji: EMOJI[i % 6],
  x: STARTS[i % 6][0], y: STARTS[i % 6][1],
  x0: STARTS[i % 6][0], y0: STARTS[i % 6][1],
  dir: 90, script, say: null, flash: 0,
});
const repeatOf = (type, times, arg) => {
  const r = newBlock("repeat", [times]);
  r.c = [newBlock(type, [arg])];
  return r;
};
// Demo for the Hero feature: Cat moves +10, Dog moves -10, both repeating.
export const initialSprites = () => [
  makeSprite(0, [repeatOf("move", 30, 10)]),
  makeSprite(1, [repeatOf("move", 30, -10)]),
];

// ---- engine: each sprite runs a generator program; one yield = one tick ----
export const TICK_MS = 40;
export const HIT_DISTANCE = 44;

export function* program(blocks) {
  for (const b of blocks) {
    if (b.type === "repeat") {
      const n = Math.max(0, Math.min(999, Number(b.a[0]) || 0));
      for (let i = 0; i < n; i++) { yield* program(b.c); yield { t: "tick" }; }
    } else yield { t: b.type, a: b.a };
  }
}

const clamp = (v, m) => Math.max(-m, Math.min(m, v));

// Applies one instruction to a sprite (mutates the copy); returns ticks to wait.
export function applyStep(s, { t, a = [] }) {
  const n = (i) => Number(a[i]) || 0;
  let wait = 0;
  if (t === "move") {
    const r = (s.dir * Math.PI) / 180;
    s.x += n(0) * Math.sin(r);
    s.y += n(0) * Math.cos(r);
  } else if (t === "turn") s.dir += n(0);
  else if (t === "goto") { s.x = n(0); s.y = n(1); }
  else if (t === "say" || t === "think") {
    s.say = { kind: t, text: String(a[0]) };
    wait = Math.max(1, Math.round((n(1) * 1000) / TICK_MS));
  }
  s.x = clamp(s.x, 216);
  s.y = clamp(s.y, 156);
  return wait;
}
