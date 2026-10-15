import { SPEC } from "../engine.js";

const inputBase = "rounded-full border-0 bg-white px-1.5 text-center font-semibold text-slate-800";
const blockBase = "my-1 flex cursor-grab select-none flex-wrap items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-white";

function Fields({ block, readOnly, onArg }) {
  const spec = SPEC[block.type];
  return spec.t.map((part, k) => {
    if (typeof part !== "number") return <span key={k}>{part}</span>;
    const isText = typeof spec.d[part] === "string";
    return (
      <input
        key={k}
        type={isText ? "text" : "number"}
        className={`${inputBase} ${isText ? "w-24" : "w-14"}`}
        value={block.a[part]}
        readOnly={readOnly}
        onChange={(e) => onArg?.(block.id, part, e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
      />
    );
  });
}

function Block({ block, parent, ctx }) {
  const over = ctx.over === block.id ? "outline-dashed outline-2 outline-offset-1 outline-slate-700 dark:outline-white" : "";
  return (
    <div
      draggable
      className={`${blockBase} ${SPEC[block.type].cls} ${over}`}
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("text/plain", block.id); ctx.drag.current = { from: "script", id: block.id }; }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); ctx.setOver(block.id); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); ctx.setOver(null); ctx.drop(parent, block.id); }}
    >
      <Fields block={block} onArg={ctx.setArg} />
      {block.type === "repeat" && (
        <div className="ml-3 basis-full border-l-[10px] border-black/20 pl-1">
          <BlockList list={block.c} parent={block.id} ctx={ctx} />
        </div>
      )}
    </div>
  );
}

export function BlockList({ list, parent, ctx }) {
  return (
    <div
      className={parent === "root" ? "min-h-[380px]" : "min-h-[34px]"}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); ctx.setOver(null); ctx.drop(parent, null); }}
    >
      {list.map((b) => <Block key={b.id} block={b} parent={parent} ctx={ctx} />)}
    </div>
  );
}

const Heading = ({ children }) => (
  <h3 className="mb-0.5 mt-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{children}</h3>
);

export function Palette({ ctx }) {
  const item = (type) => (
    <div
      key={type}
      draggable
      className={`${blockBase} ${SPEC[type].cls}`}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", type); ctx.drag.current = { from: "palette", type }; }}
    >
      <Fields block={{ id: "p" + type, type, a: SPEC[type].d }} readOnly />
    </div>
  );
  return (
    <div className="panel" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); ctx.remove(); }}>
      <Heading>Motion</Heading>
      {["move", "turn", "goto"].map(item)}
      <Heading>Looks</Heading>
      {["say", "think"].map(item)}
      <Heading>Control</Heading>
      {item("repeat")}
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Drag blocks into the script area. Drag a block back here to delete it.
      </p>
    </div>
  );
}
