-- 042_training_task_workflow.sql
-- Turns training tasks into a simple LMS workflow:
-- trainer assigns, apprentice submits evidence, trainer reviews, and
-- completion/certificate eligibility is derived from approved tasks.

alter table training_tasks add column if not exists submission_text text;
alter table training_tasks add column if not exists submitted_at timestamptz;

alter table training_tasks drop constraint if exists training_tasks_status_check;

-- Preserve existing completed tasks while moving them to the LMS vocabulary.
update training_tasks
set status = 'Approved'
where status = 'Done';

alter table training_tasks add constraint training_tasks_status_check
  check (status in ('Assigned', 'In Progress', 'Submitted', 'Needs Changes', 'Approved'));

create index if not exists idx_training_tasks_status on training_tasks(status);
