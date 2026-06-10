/**
 * Ensures every existing company has the 5 daily check templates required by
 * the QuickCheck flow. Safe to re-run — only creates templates that are missing.
 * Runs at startup after migrations, before seed-safe.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { companies, checkTemplates, checkTemplateItems } from './schema/index.js'
import { eq, and, sql as dsql, isNull } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/daily_chex'
const isRemote = connectionString.includes('neon.tech') || connectionString.includes('sslmode')

type TemplateSpec = {
  slug: string
  name: string
  description: string
  assetType: string
  assetCategory: string | null
  items: Array<{ section: string | null; label: string }>
}

const VEHICLE_DAILY_ITEMS: TemplateSpec['items'] = [
  { section: 'General Roadworthiness', label: 'Fuel / Oil / Water Leaks' },
  { section: 'General Roadworthiness', label: 'Fuel / Oil / Water Levels' },
  { section: 'General Roadworthiness', label: 'Battery Condition' },
  { section: 'General Roadworthiness', label: 'Tyre / Wheel Fixings' },
  { section: 'General Roadworthiness', label: 'Windscreen' },
  { section: 'General Roadworthiness', label: 'Washers & Wipers' },
  { section: 'General Roadworthiness', label: 'Mirrors' },
  { section: 'General Roadworthiness', label: 'Lights & Indicators' },
  { section: 'General Roadworthiness', label: 'No Plates & Reflectors' },
  { section: 'General Roadworthiness', label: 'Body Damage' },
  { section: 'General Roadworthiness', label: 'Cab Interior / Seat Belts' },
  { section: 'General Roadworthiness', label: 'Brakes ABS / LBS' },
  { section: 'General Roadworthiness', label: 'Steering' },
  { section: 'General Roadworthiness', label: 'Horn' },
  { section: 'General Roadworthiness', label: 'Locks' },
  { section: 'General Roadworthiness', label: 'Exhaust / Emissions' },
  { section: 'General Roadworthiness', label: 'Heating / Ventilation' },
  { section: 'General Roadworthiness', label: 'Spray Guards' },
  { section: 'General Roadworthiness', label: 'Fire Extinguisher' },
  { section: 'General Roadworthiness', label: 'First Aid Kit' },
]

const TRAILER_DAILY_ITEMS: TemplateSpec['items'] = [
  { section: 'Trailer Daily Safety', label: 'Towing Hitch / Coupling Secure' },
  { section: 'Trailer Daily Safety', label: 'Breakaway Cable Attached' },
  { section: 'Trailer Daily Safety', label: 'Trailer Lights & Indicators Working' },
  { section: 'Trailer Daily Safety', label: 'Number Plate Clean & Visible' },
  { section: 'Trailer Daily Safety', label: 'Tyres — Condition & Pressure' },
  { section: 'Trailer Daily Safety', label: 'Wheel Nuts / Fixings Secure' },
  { section: 'Trailer Daily Safety', label: 'Mudguards / Spray Suppression Intact' },
  { section: 'Trailer Daily Safety', label: 'Body & Floor — No Damage' },
  { section: 'Trailer Daily Safety', label: 'Securing Straps / Ratchets in Good Condition' },
  { section: 'Trailer Daily Safety', label: 'Tailgate / Drop Sides Secure' },
  { section: 'Trailer Daily Safety', label: 'Jockey Wheel & Landing Legs Operational' },
  { section: 'Trailer Daily Safety', label: 'Load Secured & Within Limits' },
]

const EXCAVATOR_DAILY_ITEMS: TemplateSpec['items'] = [
  { section: 'Walk-Around', label: 'Visual inspection — damage, cracks, loose bolts, attachment wear' },
  { section: 'Walk-Around', label: 'Fluid leaks — oil, hydraulic, coolant, fuel' },
  { section: 'Walk-Around', label: 'Engine oil level' },
  { section: 'Walk-Around', label: 'Hydraulic oil level' },
  { section: 'Walk-Around', label: 'Coolant level' },
  { section: 'Walk-Around', label: 'Fuel level — sufficient for shift' },
  { section: 'Walk-Around', label: 'Tracks / tyres — tension, condition, debris' },
  { section: 'Walk-Around', label: 'Lights, beacons, reversing alarms' },
  { section: 'Walk-Around', label: 'Horn and warning devices' },
  { section: 'Walk-Around', label: 'Mirrors / cameras clean and operational' },
  { section: 'Walk-Around', label: 'Fire extinguisher present and charged' },
  { section: 'Walk-Around', label: 'Seat belt and ROPS/FOPS condition' },
  { section: 'Walk-Around', label: 'Documentation — LOLER, thorough exam, permits' },
  { section: 'Excavator Specific', label: 'Hydraulic hoses, cylinders and rams — no leaks or wear' },
  { section: 'Excavator Specific', label: 'Boom, stick/arm, bucket — cracks, pins, quick hitch secure' },
  { section: 'Excavator Specific', label: 'Undercarriage — rollers, idlers, sprockets, shoes' },
  { section: 'Excavator Specific', label: 'Controls and safety lock lever functioning' },
  { section: 'Excavator Specific', label: 'Swing / slew mechanism — no unusual play or noise' },
  { section: 'Excavator Specific', label: 'Grease points lubricated' },
]

const DUMPER_DAILY_ITEMS: TemplateSpec['items'] = [
  { section: 'Walk-Around', label: 'Visual inspection — damage, cracks, loose bolts' },
  { section: 'Walk-Around', label: 'Fluid leaks — oil, hydraulic, coolant, fuel' },
  { section: 'Walk-Around', label: 'Engine oil level' },
  { section: 'Walk-Around', label: 'Hydraulic oil level' },
  { section: 'Walk-Around', label: 'Coolant level' },
  { section: 'Walk-Around', label: 'Fuel level — sufficient for shift' },
  { section: 'Walk-Around', label: 'Tyres — pressure, tread, cuts' },
  { section: 'Walk-Around', label: 'Lights, beacons, reversing alarms' },
  { section: 'Walk-Around', label: 'Horn and warning devices' },
  { section: 'Walk-Around', label: 'Mirrors / cameras clean and operational' },
  { section: 'Walk-Around', label: 'Fire extinguisher present and charged' },
  { section: 'Walk-Around', label: 'Seat belt and ROPS/FOPS condition' },
  { section: 'Walk-Around', label: 'Documentation — hire paperwork, insurance, permits' },
  { section: 'Dumper Specific', label: 'Skip/body and tipping rams — secure and undamaged' },
  { section: 'Dumper Specific', label: 'Brakes and steering — no excessive play' },
  { section: 'Dumper Specific', label: 'Wheel nuts — tight, no damage' },
  { section: 'Dumper Specific', label: 'Exhaust and air filter condition' },
  { section: 'Dumper Specific', label: 'Tailgate and body locks secure' },
  { section: 'Dumper Specific', label: 'Load distribution check before tipping' },
]

const PLANT_DAILY_ITEMS: TemplateSpec['items'] = [
  { section: 'Plant Check', label: 'In good working order' },
]

const TEMPLATES: TemplateSpec[] = [
  {
    slug: 'vehicle-daily',
    name: 'Vehicle Daily Check',
    description: 'Daily roadworthiness check for vans, cars and light commercial vehicles.',
    assetType: 'vehicle',
    assetCategory: null,
    items: VEHICLE_DAILY_ITEMS,
  },
  {
    slug: 'trailer-daily',
    name: 'Trailer Daily Check',
    description: 'Daily pre-use check for plant and goods trailers.',
    assetType: 'trailer',
    assetCategory: null,
    items: TRAILER_DAILY_ITEMS,
  },
  {
    slug: 'excavator-daily',
    name: 'Excavator Daily Check',
    description: 'Daily walk-around for excavators (diggers, backhoes, mini diggers).',
    assetType: 'machinery',
    assetCategory: 'digger',
    items: EXCAVATOR_DAILY_ITEMS,
  },
  {
    slug: 'dumper-daily',
    name: 'Dumper Daily Check',
    description: 'Daily walk-around for site dumpers and forward-tipping dumpers.',
    assetType: 'machinery',
    assetCategory: 'dumper',
    items: DUMPER_DAILY_ITEMS,
  },
  {
    slug: 'plant-daily',
    name: 'Plant Daily Check',
    description: 'Simple daily confirmation that plant is in good working order.',
    assetType: 'plant',
    assetCategory: null,
    items: PLANT_DAILY_ITEMS,
  },
]

async function ensureCompanyTemplates(db: ReturnType<typeof drizzle>, companyId: string) {
  for (const spec of TEMPLATES) {
    // Match by companyId + slug
    const existing = await db
      .select({ id: checkTemplates.id })
      .from(checkTemplates)
      .where(and(eq(checkTemplates.companyId, companyId), eq(checkTemplates.slug, spec.slug)))
    if (existing.length > 0) continue

    const templateId = uuidv4()
    await db.insert(checkTemplates).values({
      id: templateId,
      companyId,
      name: spec.name,
      slug: spec.slug,
      assetType: spec.assetType,
      assetCategory: spec.assetCategory,
      checkFrequency: 'daily',
      description: spec.description,
    })
    if (spec.items.length > 0) {
      await db.insert(checkTemplateItems).values(
        spec.items.map((item, i) => ({
          id: uuidv4(),
          templateId,
          section: item.section,
          label: item.label,
          sortOrder: i + 1,
        })),
      )
    }
    console.log(`  + Added template "${spec.name}" for company ${companyId.slice(0, 8)}`)
  }

  // For the legacy combined machinery template, mark it inactive so it doesn't
  // show up alongside the new per-category templates.
  await db
    .update(checkTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(checkTemplates.companyId, companyId),
        eq(checkTemplates.slug, 'machinery-walkaround-daily'),
        isNull(checkTemplates.assetCategory),
      ),
    )
}

async function run() {
  const client = postgres(connectionString, { max: 1, ssl: isRemote ? 'require' : false })
  const db = drizzle(client)

  try {
    // Skip if companies table doesn't exist or has no rows yet (fresh install)
    const allCompanies = await db.select({ id: companies.id }).from(companies)
    if (allCompanies.length === 0) {
      console.log('No companies yet — skipping template sync.')
      await client.end()
      return
    }

    // Quick sanity check that the column exists; if not, skip silently so the
    // app can still boot.
    try {
      await db.execute(dsql`SELECT asset_category FROM check_templates LIMIT 1`)
    } catch {
      console.log('asset_category column missing — skipping template sync (run migrations first).')
      await client.end()
      return
    }

    console.log(`Syncing daily templates for ${allCompanies.length} compan${allCompanies.length === 1 ? 'y' : 'ies'}...`)
    for (const c of allCompanies) {
      await ensureCompanyTemplates(db, c.id)
    }
    console.log('Template sync complete.')
  } catch (err) {
    console.error('Template sync failed (non-fatal):', err)
  }

  await client.end()
}

run().catch((err) => {
  console.error('ensure-templates fatal:', err)
  process.exit(0) // exit 0 so deploy continues
})
