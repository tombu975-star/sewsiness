-- Renames custom_orders.status values to the plain-language terms used
-- throughout the novice-friendly redesign spec: New, Confirmed,
-- In Production, Ready, Delivered, Cancelled — replacing the old
-- Pending / In Progress / Review / Completed / Overdue / Cancelled set.
--
-- "Overdue" was never actually written to this column anywhere in the
-- app (business-health computes it on the fly from due_date), so any
-- row carrying it was set manually via the status dropdown. "Review"
-- was likewise offered in the dropdown but nothing in the app (quality
-- control included) ever branched on it. Both are folded into the
-- closest real production state below so no order silently disappears
-- from anyone's filters.
--
-- Existing rows are remapped BEFORE the constraint changes, since the
-- new check constraint would otherwise reject them:
--   Pending      -> New              (order just created, nothing started)
--   In Progress  -> In Production    (matches the production-stage tracker)
--   Review       -> Ready            (closest real state; QC has its own table)
--   Overdue      -> In Production    (was never a real terminal state)
--   Completed    -> Delivered        (this was already the terminal/"done" state)
--   Cancelled    -> Cancelled        (unchanged)

update custom_orders set status = 'New' where status = 'Pending';
update custom_orders set status = 'In Production' where status in ('In Progress', 'Overdue');
update custom_orders set status = 'Ready' where status = 'Review';
update custom_orders set status = 'Delivered' where status = 'Completed';

alter table custom_orders alter column status set default 'New';
alter table custom_orders drop constraint if exists custom_orders_status_check;
alter table custom_orders add constraint custom_orders_status_check
  check (status in ('New', 'Confirmed', 'In Production', 'Ready', 'Delivered', 'Cancelled'));
