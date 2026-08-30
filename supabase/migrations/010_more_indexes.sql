-- ============================================================
-- 010_more_indexes.sql
--
-- Second pass of the FK-index audit — this one catches organization_id
-- specifically, which is the single most important column to index in
-- this app: every RLS policy filters on `organization_id = current_org_id()`,
-- so EVERY query against these tables was doing a sequential scan on the
-- tenant filter itself, not just on secondary lookups. Also picks up a
-- few FKs introduced by 007-009 that hadn't been indexed yet.
--
-- Additive/idempotent and safe to run against the live database as-is.
-- ============================================================

create index if not exists idx_advisory_notes_organization_id on advisory_notes(organization_id);
create index if not exists idx_alterations_organization_id on alterations(organization_id);
create index if not exists idx_api_keys_created_by on api_keys(created_by);
create index if not exists idx_api_keys_revoked_by on api_keys(revoked_by);
create index if not exists idx_apprentice_profiles_organization_id on apprentice_profiles(organization_id);
create index if not exists idx_audit_logs_organization_id on audit_logs(organization_id);
create index if not exists idx_branches_organization_id on branches(organization_id);
create index if not exists idx_certificates_enrollment_id on certificates(enrollment_id);
create index if not exists idx_certificates_issued_by on certificates(issued_by);
create index if not exists idx_certificates_organization_id on certificates(organization_id);
create index if not exists idx_certificates_revoked_by on certificates(revoked_by);
create index if not exists idx_collections_organization_id on collections(organization_id);
create index if not exists idx_customer_materials_organization_id on customer_materials(organization_id);
create index if not exists idx_customers_organization_id on customers(organization_id);
create index if not exists idx_designs_organization_id on designs(organization_id);
create index if not exists idx_expenses_organization_id on expenses(organization_id);
create index if not exists idx_fabrics_organization_id on fabrics(organization_id);
create index if not exists idx_feature_flags_updated_by on feature_flags(updated_by);
create index if not exists idx_fittings_organization_id on fittings(organization_id);
create index if not exists idx_freelancer_profiles_organization_id on freelancer_profiles(organization_id);
create index if not exists idx_integration_checks_updated_by on integration_checks(updated_by);
create index if not exists idx_measurements_organization_id on measurements(organization_id);
create index if not exists idx_notifications_organization_id on notifications(organization_id);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_order_costs_organization_id on order_costs(organization_id);
create index if not exists idx_payments_organization_id on payments(organization_id);
create index if not exists idx_portfolio_items_organization_id on portfolio_items(organization_id);
create index if not exists idx_product_variants_organization_id on product_variants(organization_id);
create index if not exists idx_production_stages_organization_id on production_stages(organization_id);
create index if not exists idx_products_organization_id on products(organization_id);
create index if not exists idx_profiles_organization_id on profiles(organization_id);
create index if not exists idx_program_enrollments_organization_id on program_enrollments(organization_id);
create index if not exists idx_purchase_orders_organization_id on purchase_orders(organization_id);
create index if not exists idx_quality_checks_organization_id on quality_checks(organization_id);
create index if not exists idx_suppliers_organization_id on suppliers(organization_id);
create index if not exists idx_system_incidents_created_by on system_incidents(created_by);
create index if not exists idx_system_incidents_resolved_by on system_incidents(resolved_by);
create index if not exists idx_training_modules_organization_id on training_modules(organization_id);
create index if not exists idx_training_programs_created_by on training_programs(created_by);
create index if not exists idx_training_programs_organization_id on training_programs(organization_id);
create index if not exists idx_training_tasks_evaluated_by on training_tasks(evaluated_by);
create index if not exists idx_training_tasks_organization_id on training_tasks(organization_id);
create index if not exists idx_webhooks_created_by on webhooks(created_by);
create index if not exists idx_work_requests_organization_id on work_requests(organization_id);
