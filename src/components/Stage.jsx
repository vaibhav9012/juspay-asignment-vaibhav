export default function Stage({ sprites }) {
  return (
    <div className="overflow-x-auto">
      <div className="relative h-[360px] w-[480px] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700">
        {sprites.map((s) => (
          <div
            key={s.id}
            className="absolute h-12 w-12 transition-[left,top] duration-[40ms] ease-linear"
            style={{ left: 240 + s.x - 24, top: 180 - s.y - 24 }}
          >
            {s.say && (
              <div
                className={`absolute bottom-full left-1/2 z-10 -translate-x-1/2 whitespace-nowrap border-2 border-slate-400 bg-white px-2 py-0.5 text-slate-800 ${
                  s.say.kind === "think" ? "rounded-3xl border-dashed" : "rounded-2xl"
                }`}
              >
                {s.say.kind === "think" && "💭 "}
                {s.say.text}
              </div>
            )}
            <div className="text-center text-[38px] leading-[48px]" style={{ transform: `rotate(${s.dir - 90}deg)` }}>
              {s.emoji}
            </div>
            {s.flash > 0 && <div className="absolute -right-2.5 -top-2 text-2xl">💥</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
