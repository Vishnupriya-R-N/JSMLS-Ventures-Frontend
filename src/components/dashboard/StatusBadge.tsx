import type { AccountStatus } from "@/types";

// Ensure this matches the AccountStatus type in your app
type StatusBadgeProps = {
  status: AccountStatus | string;
};

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  PENDING_VERIFICATION: "bg-yellow-100 text-yellow-800 border-yellow-200",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
  SUSPENDED: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending Verification",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Fallback to INACTIVE styles if the status isn't found
  const styleClass = statusStyles[status] || statusStyles.INACTIVE;
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styleClass}`}
    >
      {label}
    </span>
  );
}