type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Email" },
  { id: 2, label: "Verify OTP" },
  { id: 3, label: "Reset Password" },
];


export default function PasswordResetSteps({ current }: { current: Step }) {
  return (
    <nav aria-label="Password reset progress" className="mb-6">
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((step) => {
          const done = step.id < current;
          const active = step.id === current;
          return (
            <li key={step.id} className="flex flex-col items-center gap-1.5 text-center">
              <span aria-current={active ? "step" : undefined} className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-bold transition-colors ${
                  done ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-navy-700 bg-navy-700 text-white" : "border-line bg-page text-muted"
                }`}
              >
                {done ? "✓" : step.id}
              </span>
              <span className={`text-xs ${ active ? "font-semibold text-navy-900" : done ? "font-medium text-emerald-700" : "text-muted" }`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
