#!/usr/bin/env node
/**
 * Seed a complete Sewiness demo workspace with one organisation and four users.
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run from the project root:
 *   node scripts/seed-demo-users.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_ORG = 'Sewiness Demo Atelier';
const DEMO_USERS = [
  {
    email: 'owner.demo@sewiness.app',
    password: 'SewinessOwner#2026',
    full_name: 'Ama Mensah',
    role: 'owner',
  },
  {
    email: 'staff.demo@sewiness.app',
    password: 'SewinessStaff#2026',
    full_name: 'Kojo Asare',
    role: 'staff',
  },
  {
    email: 'apprentice.demo@sewiness.app',
    password: 'SewinessApprentice#2026',
    full_name: 'Abena Owusu',
    role: 'apprentice',
  },
  {
    email: 'freelancer.demo@sewiness.app',
    password: 'SewinessFreelancer#2026',
    full_name: 'Kofi Boateng',
    role: 'freelancer',
  },
];

async function getOrCreateAuthUser(definition) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = users.users.find((u) => u.email?.toLowerCase() === definition.email.toLowerCase());
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: definition.password,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), full_name: definition.full_name, demo: true },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: definition.email,
    password: definition.password,
    email_confirm: true,
    user_metadata: { full_name: definition.full_name, demo: true },
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  console.log(`Creating/updating demo organisation: ${DEMO_ORG}`);

  let { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id,name')
    .eq('name', DEMO_ORG)
    .maybeSingle();
  if (orgError) throw orgError;

  if (!org) {
    const result = await supabase
      .from('organizations')
      .insert({ name: DEMO_ORG, region: 'Greater Accra', plan: 'Trial', status: 'Active', verification_status: 'verified' })
      .select('id,name')
      .single();
    if (result.error) throw result.error;
    org = result.data;
  }

  let { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('id,name')
    .eq('organization_id', org.id)
    .eq('name', 'Main')
    .maybeSingle();
  if (branchError) throw branchError;

  if (!branch) {
    const result = await supabase
      .from('branches')
      .insert({ organization_id: org.id, name: 'Main', city: 'Accra' })
      .select('id,name')
      .single();
    if (result.error) throw result.error;
    branch = result.data;
  }

  const created = [];
  for (const definition of DEMO_USERS) {
    const authUser = await getOrCreateAuthUser(definition);

    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id,organization_id')
      .eq('id', authUser.id)
      .maybeSingle();
    if (profileLookupError) throw profileLookupError;

    if (existingProfile && existingProfile.organization_id !== org.id) {
      throw new Error(`${definition.email} already belongs to another organisation; refusing to move it.`);
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authUser.id,
      organization_id: org.id,
      branch_id: branch.id,
      full_name: definition.full_name,
      role: definition.role,
    }, { onConflict: 'id' });
    if (profileError) throw profileError;

    if (definition.role === 'apprentice') {
      const { error } = await supabase.from('apprentice_profiles').upsert({
        profile_id: authUser.id,
        organization_id: org.id,
        start_date: '2026-09-01',
        training_level: 'Intermediate',
        specialisation: 'Dressmaking & Finishing',
        training_goals: 'Build professional pattern, sewing and finishing skills.',
      }, { onConflict: 'profile_id' });
      if (error) throw error;
    }

    if (definition.role === 'freelancer') {
      const { error } = await supabase.from('freelancer_profiles').upsert({
        profile_id: authUser.id,
        organization_id: org.id,
        whatsapp: '+233500000004',
        location: 'Accra',
        primary_skill: 'Pattern Making',
        years_experience: 5,
        specialisation: 'Bridal & Occasion Wear',
      }, { onConflict: 'profile_id' });
      if (error) throw error;
    }

    created.push({ ...definition, id: authUser.id });
  }

  console.log('\nDemo workspace ready.\n');
  console.log(`Organisation: ${org.name}`);
  console.log(`Branch: ${branch.name}`);
  console.log('\nLogin credentials:');
  for (const user of created) {
    console.log(`- ${user.role.padEnd(10)} ${user.email} / ${user.password}`);
  }
}

main().catch((error) => {
  console.error('\nDemo seed failed:', error?.message || error);
  process.exit(1);
});
