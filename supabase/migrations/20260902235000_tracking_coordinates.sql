alter table public.tracking_events
  add column latitude double precision,
  add column longitude double precision;

alter table public.tracking_events
  add constraint tracking_events_latitude_range
    check (latitude is null or latitude between -90 and 90),
  add constraint tracking_events_longitude_range
    check (longitude is null or longitude between -180 and 180);
