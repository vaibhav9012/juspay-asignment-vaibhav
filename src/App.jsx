import { useRef, useState } from "react";
import {
  HIT_DISTANCE, TICK_MS, applyStep, clone, findBlock, findList, initialSprites,
  makeSprite, newBlock, program, takeBlock,
} from "./engine.js";
import { BlockList, Palette } from "./components/Blocks.jsx";
import Stage from "./components/Stage.jsx";

const btn = "rounded-lg px-3 py-1.5 font-semibold";

export default function App() {
  const [sprites, setSprites] = useState(initialSprites);
  const [activeId, setActiveId] = useState("s0");
  const [over, setOver] = useState(null);
  const [running, setRunning] = useState(false);
  const [swaps, setSwaps] = useState(0);

  const drag = useRef(null);
  const sprRef = useRef(sprites);
  const runtime = useRef({}); // spriteId -> { gen, wait }
  const touching = useRef({});
  const timer = useRef(null);
  const swapCount = useRef(0);
  const nextIndex = useRef(2);
  sprRef.current = sprites;

  const cur = sprites.find((s) => s.id === activeId) || sprites[0];
  const editScript = (fn) =>
    setSprites((ss) => ss.map((s) => (s.id === cur.id ? { ...s, script: fn(clone(s.script)) } : s)));

  const ctx = {
    drag, over, setOver,
    drop(parent, before) {
      const d = drag.current;
      drag.current = null;
      if (!d || (before && before === d.id)) return;
      const fresh = d.from === "palette" ? newBlock(d.type) : null;
      setSprites((ss) =>
        ss.map((s) => {
          if (s.id !== cur.id) return s;
          const script = clone(s.script);
          const block = fresh || takeBlock(script, d.id);
          if (!block) return s;
          const list = findList(script, parent);
          if (!list) return s; // e.g. dropping a repeat inside itself
          const i = before ? list.findIndex((x) => x.id === before) : -1;
          if (i < 0) list.push(block); else list.splice(i, 0, block);
          return { ...s, script };
        })
      );
    },
    remove() {
      const d = drag.current;
      drag.current = null;
      if (d?.from === "script") editScript((sc) => { takeBlock(sc, d.id); return sc; });
    },
    setArg(id, k, v) {
      editScript((sc) => { const b = findBlock(sc, id); if (b) b.a[k] = v; return sc; });
    },
  };

  const stop = () => { clearInterval(timer.current); setRunning(false); };
  const reset = () => {
    stop();
    setSprites((ss) => ss.map((s) => ({ ...s, x: s.x0, y: s.y0, dir: 90, say: null, flash: 0 })));
  };

  const tick = () => {
    const S = sprRef.current.map((s) => ({ ...s }));
    let live = false;
    S.forEach((s) => {
      if (s.flash > 0) s.flash--;
      const r = runtime.current[s.id];
      if (!r?.gen) return;
      live = true;
      if (r.wait > 0) { r.wait--; if (r.wait === 0) s.say = null; return; }
      const next = r.gen.next();
      if (next.done) { r.gen = null; return; }
      r.wait = applyStep(s, next.value);
    });

    // Hero feature: swap running animations when two sprites start colliding.
    for (let i = 0; i < S.length; i++) {
      for (let j = i + 1; j < S.length; j++) {
        const a = S[i], b = S[j], key = a.id + b.id;
        const hit = Math.hypot(a.x - b.x, a.y - b.y) < HIT_DISTANCE;
        if (hit && !touching.current[key]) {
          touching.current[key] = true;
          const ra = runtime.current[a.id], rb = runtime.current[b.id];
          [ra.gen, rb.gen] = [rb.gen, ra.gen];
          [ra.wait, rb.wait] = [rb.wait, ra.wait];
          a.flash = b.flash = 10;
          swapCount.current++;
          setSwaps(swapCount.current);
        } else if (!hit) delete touching.current[key];
      }
    }
    sprRef.current = S;
    setSprites(S);
    if (!live && !S.some((s) => runtime.current[s.id]?.wait > 0)) stop();
  };

  const play = () => {
    clearInterval(timer.current);
    touching.current = {};
    swapCount.current = 0;
    setSwaps(0);
    const S = sprRef.current.map((s) => ({ ...s, x: s.x0, y: s.y0, dir: 90, say: null, flash: 0 }));
    sprRef.current = S;
    setSprites(S);
    runtime.current = Object.fromEntries(S.map((s) => [s.id, { gen: program(clone(s.script)), wait: 0 }]));
    setRunning(true);
    timer.current = setInterval(tick, TICK_MS);
  };

  const addSprite = () => {
    const s = makeSprite(nextIndex.current++);
    setSprites((ss) => [...ss, s]);
    setActiveId(s.id);
  };
  const removeSprite = (id) => {
    stop();
    setSprites((ss) => {
      const rest = ss.filter((s) => s.id !== id);
      if (id === activeId) setActiveId(rest[0].id);
      return rest;
    });
  };

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center gap-2 bg-[#9966ff] px-3.5 py-2.5 text-white">
        <h1 className="min-w-[120px] flex-1 text-lg font-bold">🎨 Scratch Studio</h1>
        <span className="rounded-lg bg-black/25 px-2.5 py-1.5 font-semibold">💥 Swaps: {swaps}</span>
        <button className={`${btn} bg-white/20`} onClick={reset}>↺ Reset</button>
        {running && <button className={`${btn} bg-red-500`} onClick={stop}>■ Stop</button>}
        <button className={`${btn} bg-green-500`} onClick={play}>▶ Play all sprites</button>
      </header>

      <main className="grid grid-cols-1 items-start gap-2.5 p-2.5 lg:grid-cols-[190px_minmax(260px,1fr)_500px]">
        <Palette ctx={ctx} />

        <section className="panel">
          <h3 className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Script for {cur.emoji} {cur.name}
          </h3>
          <BlockList list={cur.script} parent="root" ctx={ctx} />
        </section>

        <section className="panel">
          <Stage sprites={sprites} />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {sprites.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`flex cursor-pointer items-center gap-1 rounded-full border-2 px-2.5 py-1 ${
                  s.id === cur.id
                    ? "border-[#9966ff] bg-[#9966ff]/15"
                    : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                }`}
              >
                {s.emoji} {s.name}
                {sprites.length > 1 && (
                  <b className="ml-1 text-red-500" onClick={(e) => { e.stopPropagation(); removeSprite(s.id); }}>×</b>
                )}
              </div>
            ))}
            <button className={`${btn} bg-slate-200 dark:bg-slate-700`} onClick={addSprite}>+ Add sprite</button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {cur.name}: x {Math.round(cur.x)}, y {Math.round(cur.y)}, direction {Math.round(cur.dir)}°.{" "}
            <b>Hero feature:</b> when two sprites collide, their running animations swap. The demo is Cat
            (move 10, repeat) vs Dog (move -10, repeat) — press Play.
          </p>
        </section>
      </main>
    </div>
  );
}
