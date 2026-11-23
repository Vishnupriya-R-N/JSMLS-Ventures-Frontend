import { DEMO_LEVELS, DEMO_PARTICIPANT } from "@/lib/demoLevels";
import type { LevelPosition } from "@/types";

const WIDTH: Record<1 | 2 | 3, string> = {
  1: "max-w-md",
  2: "max-w-2xl",
  3: "max-w-none",
};

const GRID: Record<1 | 2 | 3, string> = {
  1: "grid-cols-2",
  2: "grid-cols-2 sm:grid-cols-4",
  3: "grid-cols-2 sm:grid-cols-4 xl:grid-cols-8",
};

function Connector() {
  return <div aria-hidden="true" className="mx-auto h-6 w-px bg-line" />;
}

function PositionCard({ position }: { position: LevelPosition }) {
  const occupied = position.status === "occupied";
  return (
    <div
      className={`rounded-xl border p-3 text-center ${
        occupied ? "border-emerald-200 bg-emerald-50" : "border-dashed border-slate-300 bg-white"
      }`}
    >
      <p className="text-xs font-medium text-muted">Position {position.slot}</p>
      <p className="mt-1 break-all text-sm font-semibold text-navy-900">
        {occupied ? position.userId : "—"}
      </p>
      <span
        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
          occupied ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
        }`}
      >
        {occupied ? "Occupied" : "Empty"}
      </span>
    </div>
  );
}

export default function LevelStructure() {
  const allPositions = DEMO_LEVELS.flatMap((l) => l.positions);
  const occupiedTotal = allPositions.filter((p) => p.status === "occupied").length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[1.6rem] font-bold leading-tight text-navy-900">Three-Level Structure</h1>
        <p className="text-muted">
          {occupiedTotal} of {allPositions.length} positions occupied.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xs rounded-xl border-2 border-navy-700 bg-navy-700 p-4 text-center text-white shadow-lg shadow-navy-900/10">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-500">Participant</p>
        <p className="mt-1 font-bold">{DEMO_PARTICIPANT.fullName}</p>
        <p className="text-sm text-[#d6dcf2]">{DEMO_PARTICIPANT.userId}</p>
      </div>

      {DEMO_LEVELS.map(({ level, positions }) => {
        const occupied = positions.filter((p) => p.status === "occupied").length;
        return (
          <div key={level}>
            <Connector />
            <section
              aria-labelledby={`level-${level}`}
              className={`mx-auto w-full ${WIDTH[level]} rounded-xl border border-line bg-white p-4 shadow-lg shadow-navy-900/10 sm:p-5`}
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`level-${level}`} className="text-lg font-semibold text-navy-900">
                  Level {level}
                </h2>
                <p className="text-sm text-muted">
                  {positions.length} positions · {occupied} occupied
                </p>
              </div>
              <ul className={`grid gap-2 sm:gap-3 ${GRID[level]}`}>
                {positions.map((p) => (
                  <li key={p.id}>
                    <PositionCard position={p} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        );
      })}
    </>
  );
}