import { Link } from "react-router-dom";

import type { UpcomingBookingRow } from "@/types/customerDashboard";
import { cn } from "@/utils/cn";

interface UpcomingBookingsCardProps {
  rows: UpcomingBookingRow[];
  className?: string;
}

const STATUS_TONE: Record<UpcomingBookingRow["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-100 text-brand-logo",
  cancelled: "bg-rose-50 text-rose-700",
};

const STATUS_LABEL: Record<UpcomingBookingRow["status"], string> = {
  pending: "Pending",
  confirmed: "Upcoming",
  cancelled: "Cancelled",
};

/**
 * "Upcoming bookings" card — two-column desktop layout where each row
 * carries an avatar tile, the service title + provider line, the
 * pre-formatted when-label, and a status pill on the right.
 */
export function UpcomingBookingsCard({ rows, className }: UpcomingBookingsCardProps) {
  return (
    <section
      aria-labelledby="upcoming-bookings-heading"
      className={cn(
        "flex flex-col rounded-md border border-brand-borderLight bg-white px-5 pt-4",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <h2
          id="upcoming-bookings-heading"
          className="text-base font-bold text-brand-logo"
        >
          Upcoming bookings
        </h2>
        <Link
          to="/dashboard/customer/bookings"
          className="text-xs font-bold text-brand-primary hover:text-brand-primaryHover"
        >
          View all →
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-md bg-brand-surface/40 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-brand-logo">No upcoming bookings</p>
          <p className="mt-1 text-xs text-brand-muted">
            Browse the marketplace to find a pro and book your first job.
          </p>
          <Link
            to="/marketplace"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-xs font-semibold text-white hover:bg-brand-primaryHover"
          >
            Browse services
          </Link>
        </div>
      ) : (
        <div className="mt-4 min-h-0 flex-1 overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-brand-surface/35 text-left text-[10px] font-bold tracking-[0.16em] text-brand-muted">
                <th className="w-full rounded-l-sm px-3 py-3">Pro / service</th>
                <th className="whitespace-nowrap px-2 py-3">Date</th>
                <th className="whitespace-nowrap px-2 py-3">Status</th>
                <th className="whitespace-nowrap rounded-r-sm px-3 py-3 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-borderLight/80">
              {rows.map((row) => (
                <tr key={row.bookingId}>
                  <td className="py-3 pl-3 pr-2 align-middle">
                    <Link
                      to={`/bookings/${row.bookingId}`}
                      className="group flex items-center gap-3"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4f9bc8] text-[10px] font-bold text-white"
                      >
                        {row.providerInitials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-brand-logo group-hover:text-brand-primary">
                          {row.providerLabel}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-brand-muted">
                          {row.serviceTitle}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 align-middle text-xs font-bold text-brand-logo">
                    {row.whenLabel}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 align-middle">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-1 text-[10px] font-bold",
                        STATUS_TONE[row.status],
                      )}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right align-middle text-xs font-bold text-brand-logo">
                    {row.totalLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
