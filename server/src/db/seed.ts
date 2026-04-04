/**
 * Seed script for daily-chex database.
 * Creates SAW Utilities with realistic construction data.
 *
 * Usage: npx tsx src/db/seed.ts
 */
import { db } from './index.js'
import {
  companies,
  sites,
  teams,
  people,
  assets,
  checkTemplates,
  checkTemplateItems,
  checks,
  checkItems,
  defects,
} from './schema/index.js'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

// Fixed UUIDs for stable references
const IDS = {
  company: uuidv4(),
  // Sites
  siteM62: uuidv4(),
  siteLeeds: uuidv4(),
  siteManchester: uuidv4(),
  // Teams
  teamAlpha: uuidv4(),
  teamBravo: uuidv4(),
  teamCharlie: uuidv4(),
  // People
  markJohnson: uuidv4(),
  davePatel: uuidv4(),
  steveWilson: uuidv4(),
  tomBaker: uuidv4(),
  ryanClark: uuidv4(),
  jamesMorgan: uuidv4(),
  // Assets
  fordTransit1: uuidv4(),
  fordTransit2: uuidv4(),
  daff7_5t: uuidv4(),
  iforTrailer: uuidv4(),
  jcb3cx: uuidv4(),
  cat308: uuidv4(),
  wackerPlate: uuidv4(),
  gennyA: uuidv4(),
  breaker1: uuidv4(),
  subPump1: uuidv4(),
  // Templates
  tplVehicleWeekly: uuidv4(),
  tplPUWER: uuidv4(),
  tplVehicleDaily: uuidv4(),
}

function qr(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CHX-'
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

async function seed() {
  console.log('Seeding daily-chex database...\n')

  // ── Company ──
  await db.insert(companies).values({
    id: IDS.company,
    name: 'SAW Utilities',
    slug: 'saw-utilities',
  })
  console.log('✓ Company: SAW Utilities')

  // ── Sites ──
  await db.insert(sites).values([
    {
      id: IDS.siteM62,
      companyId: IDS.company,
      name: 'M62 Junction 8 Upgrade',
      address: 'M62 Junction 8, Burtonwood',
      postcode: 'WA5 4QE',
      lat: '53.4233',
      lng: '-2.6489',
    },
    {
      id: IDS.siteLeeds,
      companyId: IDS.company,
      name: 'Leeds A64 Widening',
      address: 'A64 York Road, Seacroft',
      postcode: 'LS14 6JD',
      lat: '53.8178',
      lng: '-1.4837',
    },
    {
      id: IDS.siteManchester,
      companyId: IDS.company,
      name: 'Manchester Water Main Renewal',
      address: 'Piccadilly Basin, Manchester',
      postcode: 'M1 2BN',
      lat: '53.4849',
      lng: '-2.2364',
    },
  ])
  console.log('✓ 3 sites created')

  // ── Teams ──
  await db.insert(teams).values([
    { id: IDS.teamAlpha, companyId: IDS.company, siteId: IDS.siteM62, name: 'Alpha Crew' },
    { id: IDS.teamBravo, companyId: IDS.company, siteId: IDS.siteLeeds, name: 'Bravo Crew' },
    { id: IDS.teamCharlie, companyId: IDS.company, siteId: IDS.siteManchester, name: 'Charlie Crew' },
  ])
  console.log('✓ 3 teams created')

  // ── People ──
  // Hash PINs and passwords
  const [pin1234, pin5678, pin1111, pin2222, pin3333, pin4444] = await Promise.all([
    bcrypt.hash('1234', SALT_ROUNDS),
    bcrypt.hash('5678', SALT_ROUNDS),
    bcrypt.hash('1111', SALT_ROUNDS),
    bcrypt.hash('2222', SALT_ROUNDS),
    bcrypt.hash('3333', SALT_ROUNDS),
    bcrypt.hash('4444', SALT_ROUNDS),
  ])
  const managerPass = await bcrypt.hash('SawAdmin2025!', SALT_ROUNDS)
  const supervisorPass = await bcrypt.hash('SawSuper2025!', SALT_ROUNDS)

  await db.insert(people).values([
    {
      id: IDS.markJohnson,
      companyId: IDS.company,
      teamId: IDS.teamAlpha,
      firstName: 'Mark',
      lastName: 'Johnson',
      phone: '07700 900100',
      email: 'mark.johnson@sawutilities.co.uk',
      role: 'manager',
      licenceNo: 'JOHNS710150MJ9AB',
      pin: pin1234,
      passwordHash: managerPass,
    },
    {
      id: IDS.davePatel,
      companyId: IDS.company,
      teamId: IDS.teamAlpha,
      firstName: 'Dave',
      lastName: 'Patel',
      phone: '07700 900101',
      role: 'supervisor',
      pin: pin5678,
      passwordHash: supervisorPass,
    },
    {
      id: IDS.steveWilson,
      companyId: IDS.company,
      teamId: IDS.teamAlpha,
      firstName: 'Steve',
      lastName: 'Wilson',
      phone: '07700 900102',
      role: 'operator',
      licenceNo: 'WILSO850220SW1CD',
      pin: pin1111,
    },
    {
      id: IDS.tomBaker,
      companyId: IDS.company,
      teamId: IDS.teamBravo,
      firstName: 'Tom',
      lastName: 'Baker',
      phone: '07700 900103',
      role: 'supervisor',
      pin: pin2222,
      passwordHash: supervisorPass,
    },
    {
      id: IDS.ryanClark,
      companyId: IDS.company,
      teamId: IDS.teamBravo,
      firstName: 'Ryan',
      lastName: 'Clark',
      phone: '07700 900104',
      role: 'operator',
      licenceNo: 'CLARK900415RC3EF',
      pin: pin3333,
    },
    {
      id: IDS.jamesMorgan,
      companyId: IDS.company,
      teamId: IDS.teamCharlie,
      firstName: 'James',
      lastName: 'Morgan',
      phone: '07700 900105',
      email: 'james.morgan@sawutilities.co.uk',
      role: 'supervisor',
      pin: pin4444,
      passwordHash: supervisorPass,
    },
  ])
  console.log('✓ 6 people created')

  // ── Assets ──
  await db.insert(assets).values([
    {
      id: IDS.fordTransit1,
      companyId: IDS.company,
      siteId: IDS.siteM62,
      type: 'vehicle',
      name: 'Ford Transit Custom #1',
      registration: 'YN73 XKR',
      category: 'van',
      weightClass: 'standard',
      qrCode: qr(),
      nextService: '2025-08-15',
    },
    {
      id: IDS.fordTransit2,
      companyId: IDS.company,
      siteId: IDS.siteLeeds,
      type: 'vehicle',
      name: 'Ford Transit Custom #2',
      registration: 'YN73 XKS',
      category: 'van',
      weightClass: 'standard',
      qrCode: qr(),
      nextService: '2025-09-01',
    },
    {
      id: IDS.daff7_5t,
      companyId: IDS.company,
      siteId: IDS.siteM62,
      type: 'vehicle',
      name: 'DAF LF 7.5t Tipper',
      registration: 'MF72 ABX',
      category: 'tipper',
      weightClass: 'over_7_5t',
      qrCode: qr(),
      nextService: '2025-07-20',
    },
    {
      id: IDS.iforTrailer,
      companyId: IDS.company,
      siteId: IDS.siteM62,
      type: 'trailer',
      name: 'Ifor Williams GH1054 Plant Trailer',
      registration: 'T-1054',
      category: 'trailer',
      qrCode: qr(),
      nextService: '2025-10-01',
    },
    {
      id: IDS.jcb3cx,
      companyId: IDS.company,
      siteId: IDS.siteM62,
      type: 'plant',
      name: 'JCB 3CX Backhoe',
      plantId: 'GAP-29847',
      supplier: 'GAP Group',
      category: 'digger',
      qrCode: qr(),
      calibrationDue: '2025-09-15',
    },
    {
      id: IDS.cat308,
      companyId: IDS.company,
      siteId: IDS.siteLeeds,
      type: 'plant',
      name: 'CAT 308 Mini Excavator',
      plantId: 'GAP-31205',
      supplier: 'GAP Group',
      category: 'cat',
      qrCode: qr(),
      calibrationDue: '2025-08-30',
    },
    {
      id: IDS.wackerPlate,
      companyId: IDS.company,
      siteId: IDS.siteManchester,
      type: 'plant',
      name: 'Wacker Neuson WP1550 Plate',
      plantId: 'SUN-44210',
      supplier: 'Sunbelt Rentals',
      category: 'other',
      qrCode: qr(),
      calibrationDue: '2025-11-01',
    },
    {
      id: IDS.gennyA,
      companyId: IDS.company,
      siteId: IDS.siteM62,
      type: 'plant',
      name: 'Stephill 6kVA Generator',
      plantId: 'GAP-51002',
      supplier: 'GAP Group',
      category: 'genny',
      qrCode: qr(),
      calibrationDue: '2025-10-20',
    },
    {
      id: IDS.breaker1,
      companyId: IDS.company,
      siteId: IDS.siteManchester,
      type: 'plant',
      name: 'Atlas Copco SB202 Breaker',
      plantId: 'SUN-44350',
      supplier: 'Sunbelt Rentals',
      category: 'breaker',
      qrCode: qr(),
      calibrationDue: '2025-12-01',
    },
    {
      id: IDS.subPump1,
      companyId: IDS.company,
      siteId: IDS.siteManchester,
      type: 'plant',
      name: 'Flygt 2066 Submersible Pump',
      plantId: 'GAP-60145',
      supplier: 'GAP Group',
      category: 'sub_pump',
      qrCode: qr(),
      calibrationDue: '2025-09-28',
    },
  ])
  console.log('✓ 10 assets created')

  // ── Check Templates ──

  // Template 1: Vehicle & Trailer Weekly
  await db.insert(checkTemplates).values({
    id: IDS.tplVehicleWeekly,
    companyId: IDS.company,
    name: 'Vehicle & Trailer Weekly Inspection',
    slug: 'vehicle-trailer-weekly',
    assetType: 'vehicle',
    checkFrequency: 'weekly',
    description: 'Weekly vehicle and trailer safety inspection (MGroup form)',
  })

  const vehicleWeeklyItems = [
    // Vehicle Safety section (15 items)
    { section: 'Vehicle Safety', label: 'Lights & Indicators', sortOrder: 1 },
    { section: 'Vehicle Safety', label: 'Reflectors', sortOrder: 2 },
    { section: 'Vehicle Safety', label: 'Mirrors', sortOrder: 3 },
    { section: 'Vehicle Safety', label: 'Windscreen', sortOrder: 4 },
    { section: 'Vehicle Safety', label: 'Wipers & Washers', sortOrder: 5 },
    { section: 'Vehicle Safety', label: 'Steering', sortOrder: 6 },
    { section: 'Vehicle Safety', label: 'Horn', sortOrder: 7 },
    { section: 'Vehicle Safety', label: 'Brakes & ABS', sortOrder: 8 },
    { section: 'Vehicle Safety', label: 'Tyres & Wheel Fixings', sortOrder: 9 },
    { section: 'Vehicle Safety', label: 'Height Marker', sortOrder: 10 },
    { section: 'Vehicle Safety', label: 'Exhaust & Emissions', sortOrder: 11 },
    { section: 'Vehicle Safety', label: 'Body Condition', sortOrder: 12 },
    { section: 'Vehicle Safety', label: 'Number Plates', sortOrder: 13 },
    { section: 'Vehicle Safety', label: 'Fuel / Oil / Water', sortOrder: 14 },
    { section: 'Vehicle Safety', label: 'Fire Extinguisher', sortOrder: 15 },
    // Trailer Safety section (15 items)
    { section: 'Trailer Safety', label: 'Towing Cable', sortOrder: 16 },
    { section: 'Trailer Safety', label: 'Breakaway Cable', sortOrder: 17 },
    { section: 'Trailer Safety', label: 'Trailer Lights', sortOrder: 18 },
    { section: 'Trailer Safety', label: 'Trailer Reflectors', sortOrder: 19 },
    { section: 'Trailer Safety', label: 'Trailer Tyres', sortOrder: 20 },
    { section: 'Trailer Safety', label: 'Trailer Wheel Fixings', sortOrder: 21 },
    { section: 'Trailer Safety', label: 'Mudguards', sortOrder: 22 },
    { section: 'Trailer Safety', label: 'Trailer Body Condition', sortOrder: 23 },
    { section: 'Trailer Safety', label: 'Trailer Number Plates', sortOrder: 24 },
    { section: 'Trailer Safety', label: 'Securing Straps', sortOrder: 25 },
    { section: 'Trailer Safety', label: 'Spray Suppression', sortOrder: 26 },
    { section: 'Trailer Safety', label: 'Landing Legs', sortOrder: 27 },
    { section: 'Trailer Safety', label: 'Kingpin / Coupling', sortOrder: 28 },
    { section: 'Trailer Safety', label: 'Ground Chains', sortOrder: 29 },
    { section: 'Trailer Safety', label: 'Twist Locks', sortOrder: 30 },
  ]

  const vwItemIds = vehicleWeeklyItems.map(() => uuidv4())
  await db.insert(checkTemplateItems).values(
    vehicleWeeklyItems.map((item, i) => ({
      id: vwItemIds[i],
      templateId: IDS.tplVehicleWeekly,
      ...item,
    })),
  )
  console.log('✓ Template 1: Vehicle & Trailer Weekly (30 items)')

  // Template 2: PUWER Weekly
  await db.insert(checkTemplates).values({
    id: IDS.tplPUWER,
    companyId: IDS.company,
    name: 'Weekly PUWER Inspection Report',
    slug: 'puwer-weekly',
    assetType: 'plant',
    checkFrequency: 'weekly',
    description: 'Weekly plant and equipment inspection per PUWER regs (SAW Ltd form)',
  })

  const puwerItemId = uuidv4()
  await db.insert(checkTemplateItems).values({
    id: puwerItemId,
    templateId: IDS.tplPUWER,
    section: 'Daily Inspection',
    label: 'Daily Inspection Pass/Fail',
    sortOrder: 1,
  })
  console.log('✓ Template 2: PUWER Weekly (1 repeating item per asset/day)')

  // Template 3: Vehicle Daily Check
  await db.insert(checkTemplates).values({
    id: IDS.tplVehicleDaily,
    companyId: IDS.company,
    name: 'Vehicle Daily Check Sheet',
    slug: 'vehicle-daily',
    assetType: 'vehicle',
    checkFrequency: 'daily',
    description: 'Daily vehicle roadworthiness check with weekly grid (General Fleet form)',
  })

  const vehicleDailyItems = [
    // General Roadworthiness (20 items, all vehicles)
    { section: 'General Roadworthiness', label: 'Fuel / Oil / Water Leaks', sortOrder: 1 },
    { section: 'General Roadworthiness', label: 'Fuel / Oil / Water Levels', sortOrder: 2 },
    { section: 'General Roadworthiness', label: 'Battery Condition', sortOrder: 3 },
    { section: 'General Roadworthiness', label: 'Tyre / Wheel Fixings', sortOrder: 4 },
    { section: 'General Roadworthiness', label: 'Windscreen', sortOrder: 5 },
    { section: 'General Roadworthiness', label: 'Washers & Wipers', sortOrder: 6 },
    { section: 'General Roadworthiness', label: 'Mirrors', sortOrder: 7 },
    { section: 'General Roadworthiness', label: 'Lights & Indicators', sortOrder: 8 },
    { section: 'General Roadworthiness', label: 'No Plates & Reflectors', sortOrder: 9 },
    { section: 'General Roadworthiness', label: 'Body Damage', sortOrder: 10 },
    { section: 'General Roadworthiness', label: 'Cab Interior / Seat Belts', sortOrder: 11 },
    { section: 'General Roadworthiness', label: 'Brakes ABS / LBS', sortOrder: 12 },
    { section: 'General Roadworthiness', label: 'Steering', sortOrder: 13 },
    { section: 'General Roadworthiness', label: 'Horn', sortOrder: 14 },
    { section: 'General Roadworthiness', label: 'Locks', sortOrder: 15 },
    { section: 'General Roadworthiness', label: 'Exhaust / Emissions', sortOrder: 16 },
    { section: 'General Roadworthiness', label: 'Heating / Ventilation', sortOrder: 17 },
    { section: 'General Roadworthiness', label: 'Spray Guards', sortOrder: 18 },
    { section: 'General Roadworthiness', label: 'Fire Extinguisher', sortOrder: 19 },
    { section: 'General Roadworthiness', label: 'First Aid Kit', sortOrder: 20 },
    // Vehicles 7.5T and Over (6 items, conditional)
    { section: 'Vehicles 7.5T and Over', label: 'Plating Certificate', sortOrder: 21, appliesWhen: '{"weight_class":"over_7_5t"}' },
    { section: 'Vehicles 7.5T and Over', label: 'Tachograph Unit', sortOrder: 22, appliesWhen: '{"weight_class":"over_7_5t"}' },
    { section: 'Vehicles 7.5T and Over', label: 'Operators Licence Disc', sortOrder: 23, appliesWhen: '{"weight_class":"over_7_5t"}' },
    { section: 'Vehicles 7.5T and Over', label: 'Speedometer / Odometer', sortOrder: 24, appliesWhen: '{"weight_class":"over_7_5t"}' },
    { section: 'Vehicles 7.5T and Over', label: 'Speed Limiter', sortOrder: 25, appliesWhen: '{"weight_class":"over_7_5t"}' },
    { section: 'Vehicles 7.5T and Over', label: 'Crane Operation', sortOrder: 26, appliesWhen: '{"weight_class":"over_7_5t"}' },
    // Towing and Lifting Equipment (4 items, conditional)
    { section: 'Towing & Lifting Equipment', label: 'Towing Equip & Trailer Socket', sortOrder: 27 },
    { section: 'Towing & Lifting Equipment', label: 'Winches (Mobile & Fixed)', sortOrder: 28 },
    { section: 'Towing & Lifting Equipment', label: 'Load Secured', sortOrder: 29 },
    { section: 'Towing & Lifting Equipment', label: 'Safety Alarms', sortOrder: 30 },
  ]

  const vdItemIds = vehicleDailyItems.map(() => uuidv4())
  await db.insert(checkTemplateItems).values(
    vehicleDailyItems.map((item, i) => ({
      id: vdItemIds[i],
      templateId: IDS.tplVehicleDaily,
      section: item.section,
      label: item.label,
      sortOrder: item.sortOrder,
      appliesWhen: (item as any).appliesWhen ?? null,
    })),
  )
  console.log('✓ Template 3: Vehicle Daily Check (30 items)')

  // ── Sample Checks ──

  // Completed vehicle weekly check for Ford Transit #1
  const checkId1 = uuidv4()
  const yesterday = new Date(Date.now() - 86400000)
  const weekEnding = '2025-07-13'
  await db.insert(checks).values({
    id: checkId1,
    companyId: IDS.company,
    assetId: IDS.fordTransit1,
    personId: IDS.steveWilson,
    siteId: IDS.siteM62,
    teamId: IDS.teamAlpha,
    checkTemplateId: IDS.tplVehicleWeekly,
    status: 'completed',
    overallResult: 'fail',
    weekEnding,
    mileageStart: 34200,
    mileageEnd: 34580,
    startLat: '53.4233',
    startLng: '-2.6489',
    startAccuracy: '8.50',
    endLat: '53.4235',
    endLng: '-2.6491',
    endAccuracy: '6.20',
    completedAt: yesterday,
  })

  // Add check items: days 0-4 (Mon-Fri) for first 15 vehicle items, mostly pass with one fail
  const checkItemRows: Array<{
    checkId: string
    templateItemId: string
    dayOfWeek: number
    result: 'pass' | 'fail' | 'na'
    notes: string | null
  }> = []

  for (let day = 0; day < 5; day++) {
    for (let itemIdx = 0; itemIdx < 15; itemIdx++) {
      const isFailing = itemIdx === 8 && day >= 3 // Tyres fail from Thursday
      checkItemRows.push({
        checkId: checkId1,
        templateItemId: vwItemIds[itemIdx],
        dayOfWeek: day,
        result: isFailing ? 'fail' : 'pass',
        notes: isFailing ? 'Nearside front tyre below legal tread depth' : null,
      })
    }
  }
  await db.insert(checkItems).values(checkItemRows)
  console.log('✓ Sample check 1: Vehicle Weekly (75 items, 1 fail)')

  // Completed PUWER check for JCB 3CX
  const checkId2 = uuidv4()
  await db.insert(checks).values({
    id: checkId2,
    companyId: IDS.company,
    assetId: IDS.jcb3cx,
    personId: IDS.davePatel,
    siteId: IDS.siteM62,
    teamId: IDS.teamAlpha,
    checkTemplateId: IDS.tplPUWER,
    status: 'completed',
    overallResult: 'pass',
    weekEnding,
    startLat: '53.4231',
    startLng: '-2.6490',
    startAccuracy: '12.00',
    completedAt: yesterday,
  })

  const puwerItemRows: Array<{
    checkId: string
    templateItemId: string
    dayOfWeek: number
    result: 'pass' | 'fail' | 'na'
    notes: string | null
  }> = []
  for (let day = 0; day < 5; day++) {
    puwerItemRows.push({
      checkId: checkId2,
      templateItemId: puwerItemId,
      dayOfWeek: day,
      result: 'pass',
      notes: null,
    })
  }
  await db.insert(checkItems).values(puwerItemRows)
  console.log('✓ Sample check 2: PUWER Weekly for JCB 3CX (5 days pass)')

  // In-progress daily check for DAF 7.5t
  const checkId3 = uuidv4()
  await db.insert(checks).values({
    id: checkId3,
    companyId: IDS.company,
    assetId: IDS.daff7_5t,
    personId: IDS.steveWilson,
    siteId: IDS.siteM62,
    teamId: IDS.teamAlpha,
    checkTemplateId: IDS.tplVehicleDaily,
    status: 'in_progress',
    mileageStart: 89450,
    placePurked: 'Compound A, M62 J8',
    weekEnding,
    startLat: '53.4234',
    startLng: '-2.6488',
    startAccuracy: '5.30',
  })
  console.log('✓ Sample check 3: Vehicle Daily in-progress for DAF')

  // ── Defects ──
  await db.insert(defects).values([
    {
      companyId: IDS.company,
      checkId: checkId1,
      assetId: IDS.fordTransit1,
      reportedBy: IDS.steveWilson,
      description: 'Nearside front tyre below legal tread depth (1.2mm). Needs replacing before next use.',
      severity: 'high',
      status: 'open',
    },
    {
      companyId: IDS.company,
      assetId: IDS.cat308,
      reportedBy: IDS.ryanClark,
      description: 'Hydraulic hose weeping on boom arm. Small leak, not affecting operation yet.',
      severity: 'medium',
      status: 'in_progress',
      actionTaken: 'Ordered replacement hose from CAT dealer. Expected delivery Thursday.',
    },
    {
      companyId: IDS.company,
      assetId: IDS.gennyA,
      reportedBy: IDS.davePatel,
      description: 'Pull-start cord frayed. Generator still starts but cord needs replacing.',
      severity: 'low',
      status: 'resolved',
      actionTaken: 'Replaced pull cord assembly. Tested and working.',
      resolvedBy: IDS.davePatel,
      resolvedAt: yesterday,
    },
  ])
  console.log('✓ 3 defects created (1 open, 1 in-progress, 1 resolved)')

  console.log('\n✅ Seed complete! SAW Utilities ready to go.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
