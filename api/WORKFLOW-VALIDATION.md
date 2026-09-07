# Delivery workflow validation

Completed on 2026-09-06 against the local application at
`http://localhost:3000`, using its configured Dergo24 Supabase project.
This was an HTTP API integration run through the actual controllers,
services, repositories, Supabase Auth, PostgreSQL RPCs, and private Storage.
It was not a browser interaction test or a physical delivery/payment.

## Results

21 live workflow checks passed:

- Unauthenticated session rejection.
- Two customer registrations, logout, login and protected session cookies.
- Dispatcher and two courier logins with the expected roles.
- Dispatcher creates a driver and links it to the assigned courier.
- Customer books a standard 2 kg shipment; quoted price is 600 ALL.
- Initial tracking event and customer dashboard reflect the booking.
- Another customer cannot see or claim that shipment.
- Public tracking omits recipient phone and street address.
- Rating before delivery is rejected.
- Dispatcher assignment appears in the assigned courier's dashboard.
- The other courier cannot access the proof or change shipment status.
- Assigned courier can retrieve the shipping label.
- Pickup, transport and out-for-delivery updates persist.
- Direct delivered-status update and incorrect COD collection are rejected.
- Delivery stores signature, PNG photo, exact test COD and tracking history.
- Private signed photo URL returns the uploaded PNG.
- Repeated delivery and settlement by a courier are rejected.
- Dispatcher settles the synthetic COD; repeat settlement is rejected.
- Another customer's rating is rejected; the owner can rate the shipment.
- Customer dashboard shows delivered, settled, rating 5 and six tracking events.
- Public tracking shows delivered and six events.

Related assertions are grouped within the 21 reported checks.

## Cleanup

The run created only marked synthetic fixtures: five Auth identities
(two customers, a dispatcher and two couriers), one linked driver,
one shipment and its related records, and one proof photo.
No existing account credentials were changed.

Cleanup was followed by independent read-only verification:
zero fixture rows remain in shipments, tracking events, delivery proofs,
ratings, claims, drivers, customer profiles or staff profiles.
All five Auth identities return not found; the fixture Storage folder is empty.
No physical package or real money was moved.

## Limits and next step

The tested happy path and listed rejection paths passed without application
changes. This does not establish coverage for every route, concurrent users,
network interruptions, browser layout, accessibility, or production deployment.
The hosted application's code was not deployed as part of this run.

Next: the broader access-control and upload/login hardening review (step 4).
Temporary scripts and the local result manifest are under the ignored
`.wrangler/` directory; credentials and session tokens were not written
to the result manifest.
