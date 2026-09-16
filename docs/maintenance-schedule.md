# Maintenance interval checks

Garage evaluates due items whenever the signed-in home page loads. There is no background cron yet.

## What we check today

1. **Explicit due dates / mileages** on a maintenance record (`nextDueDate`, `nextDueMileage`).
2. **Standard intervals** from the last matching record:
   - Oil change — 5,000 miles or 180 days
   - Tire rotation — 7,500 miles or 365 days
   - Inspection — 365 days
3. **Missing records** — if a vehicle has never logged an oil change, we surface that so the clock can start.

“Due soon” is the last 500 miles or 30 days of an interval. Overdue wins over due-soon for the same service.

## How to keep this accurate

- Log services with the type dropdown (`Oil change`, not free-text nicknames) so matching stays reliable.
- Set **next due mileage / date** on a record when you know a shop’s recommendation.
- Keep **odometer** current when you add a record or edit the vehicle.

## Next steps (not built yet)

- Per-vehicle interval overrides (classic vs daily driver).
- Cloudflare Cron Worker (daily) that recomputes alerts and optionally emails / pushes.
- Reminders when odometer is updated and crosses a due mileage.
