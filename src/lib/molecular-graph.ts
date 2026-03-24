// ===== Molecular Graph Data Structure =====
// Defines nodes, bonds, ring config, and lineage tracing for the 3D molecular filter.

export interface MolecularNode {
  id: string;
  label: string;
  ring: number;
  angle: number;
  color: string;
  radius: number;
  description: string;
  filterType?: 'division' | 'agency' | 'productLine' | 'audience' | 'campaign' | 'channel' | 'funnel' | 'geo';
  filterValue?: string;
}

export interface MolecularBond {
  source: string;
  target: string;
}

export const RING_COLORS = {
  nucleus: '#E24B4A',
  org: '#7F77DD',
  product: '#1D9E75',
  audience: '#D85A30',
  campaign: '#5DCAA5',
  exec: '#378ADD',
};

export const RING_RADII = [0, 8, 14, 20, 27, 34];

// Visual sphere radii per ring (how big the node orb appears)
export const RING_NODE_RADII = [2.0, 1.3, 1.0, 0.9, 0.7, 0.6];

// Fibonacci sphere distribution for even spacing on a sphere surface
function fibonacciSphere(numPoints: number, radius: number): [number, number, number][] {
  if (numPoints === 1) return [[0, 0, 0]];
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < numPoints; i++) {
    const y = 1 - (i / (numPoints - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push([
      radius * radiusAtY * Math.cos(theta),
      radius * y * 0.7, // oblate spheroid
      radius * radiusAtY * Math.sin(theta),
    ]);
  }
  return points;
}

// Precompute 3D positions for each node using Fibonacci sphere per ring
const _nodeBasePositions = new Map<string, [number, number, number]>();

function computeBasePositions(nodes: MolecularNode[]) {
  // Group by ring
  const byRing = new Map<number, MolecularNode[]>();
  for (const n of nodes) {
    if (!byRing.has(n.ring)) byRing.set(n.ring, []);
    byRing.get(n.ring)!.push(n);
  }
  for (const [ring, ringNodes] of byRing) {
    const radius = RING_RADII[ring];
    if (ring === 0) {
      _nodeBasePositions.set(ringNodes[0].id, [0, 0, 0]);
      continue;
    }
    const positions = fibonacciSphere(ringNodes.length, radius);
    for (let i = 0; i < ringNodes.length; i++) {
      _nodeBasePositions.set(ringNodes[i].id, positions[i]);
    }
  }
}

export function getBasePosition(id: string): [number, number, number] {
  return _nodeBasePositions.get(id) ?? [0, 0, 0];
}

// ===== Node Definitions =====

const NODES: MolecularNode[] = [
  // Ring 0 — Nucleus
  { id: 'rbc', label: 'RBC', ring: 0, angle: 0, color: RING_COLORS.nucleus, radius: 2.5, description: 'Royal Bank of Canada' },

  // Ring 1 — Organizational (4 divisions + 5 agencies)
  { id: 'pcb', label: 'PCB', ring: 1, angle: 0, color: RING_COLORS.org, radius: 1.4, description: 'Personal & Commercial Banking', filterType: 'division', filterValue: 'pcb' },
  { id: 'wealth', label: 'Wealth', ring: 1, angle: 72, color: RING_COLORS.org, radius: 1.4, description: 'Wealth Management', filterType: 'division', filterValue: 'wealth' },
  { id: 'insurance', label: 'Insurance', ring: 1, angle: 144, color: RING_COLORS.org, radius: 1.4, description: 'Insurance', filterType: 'division', filterValue: 'insurance' },
  { id: 'capital-markets', label: 'Capital Mkts', ring: 1, angle: 216, color: RING_COLORS.org, radius: 1.4, description: 'Capital Markets', filterType: 'division', filterValue: 'capital-markets' },
  { id: 'omnicom', label: 'Omnicom', ring: 1, angle: 36, color: RING_COLORS.org, radius: 1.1, description: 'Omnicom Media Group', filterType: 'agency', filterValue: 'omnicom' },
  { id: 'publicis', label: 'Publicis', ring: 1, angle: 108, color: RING_COLORS.org, radius: 1.1, description: 'Publicis Groupe', filterType: 'agency', filterValue: 'publicis' },
  { id: 'wpp', label: 'WPP', ring: 1, angle: 180, color: RING_COLORS.org, radius: 1.1, description: 'WPP', filterType: 'agency', filterValue: 'wpp' },
  { id: 'in-house', label: 'In-House', ring: 1, angle: 252, color: RING_COLORS.org, radius: 1.1, description: 'RBC In-House', filterType: 'agency', filterValue: 'in-house' },
  { id: 'other', label: 'Other', ring: 1, angle: 324, color: RING_COLORS.org, radius: 1.1, description: 'Other Agencies', filterType: 'agency', filterValue: 'other' },

  // Ring 2 — Product Lines (12 nodes at 30° intervals)
  { id: 'avion', label: 'Avion', ring: 2, angle: 0, color: RING_COLORS.product, radius: 1.2, description: 'Avion Credit Card', filterType: 'productLine', filterValue: 'avion' },
  { id: 'ion', label: 'ION', ring: 2, angle: 30, color: RING_COLORS.product, radius: 1.2, description: 'ION Card', filterType: 'productLine', filterValue: 'ion' },
  { id: 'rewards', label: 'Rewards', ring: 2, angle: 60, color: RING_COLORS.product, radius: 1.2, description: 'RBC Rewards', filterType: 'productLine', filterValue: 'rewards' },
  { id: 'mortgage', label: 'Mortgage', ring: 2, angle: 90, color: RING_COLORS.product, radius: 1.2, description: 'Mortgages & Home Equity', filterType: 'productLine', filterValue: 'mortgage' },
  { id: 'direct-investing', label: 'Direct Inv.', ring: 2, angle: 120, color: RING_COLORS.product, radius: 1.2, description: 'RBC Direct Investing', filterType: 'productLine', filterValue: 'direct-investing' },
  { id: 'dominion-securities', label: 'Dom. Sec.', ring: 2, angle: 150, color: RING_COLORS.product, radius: 1.2, description: 'RBC Dominion Securities', filterType: 'productLine', filterValue: 'dominion-securities' },
  { id: 'insurance-products', label: 'Ins. Products', ring: 2, angle: 180, color: RING_COLORS.product, radius: 1.2, description: 'Insurance Products', filterType: 'productLine', filterValue: 'insurance-products' },
  { id: 'student', label: 'Student', ring: 2, angle: 210, color: RING_COLORS.product, radius: 1.2, description: 'Student Banking', filterType: 'productLine', filterValue: 'student' },
  { id: 'newcomer', label: 'Newcomer', ring: 2, angle: 240, color: RING_COLORS.product, radius: 1.2, description: 'Newcomer Banking', filterType: 'productLine', filterValue: 'newcomer' },
  { id: 'small-business', label: 'Small Biz', ring: 2, angle: 270, color: RING_COLORS.product, radius: 1.2, description: 'Small Business Banking', filterType: 'productLine', filterValue: 'small-business' },
  { id: 'commercial-lending', label: 'Comm. Lending', ring: 2, angle: 300, color: RING_COLORS.product, radius: 1.2, description: 'Commercial Lending', filterType: 'productLine', filterValue: 'commercial-lending' },
  { id: 'gic-savings', label: 'GIC/Savings', ring: 2, angle: 330, color: RING_COLORS.product, radius: 1.2, description: 'GICs & Savings', filterType: 'productLine', filterValue: 'gic-savings' },

  // Ring 3 — Audiences (8 nodes at 45° intervals)
  { id: 'young-professionals', label: 'Young Pros', ring: 3, angle: 0, color: RING_COLORS.audience, radius: 1.0, description: 'Young Professionals', filterType: 'audience', filterValue: 'young-professionals' },
  { id: 'families', label: 'Families', ring: 3, angle: 45, color: RING_COLORS.audience, radius: 1.0, description: 'Families', filterType: 'audience', filterValue: 'families' },
  { id: 'new-canadians', label: 'New Canadians', ring: 3, angle: 90, color: RING_COLORS.audience, radius: 1.0, description: 'New Canadians', filterType: 'audience', filterValue: 'new-canadians' },
  { id: 'high-net-worth', label: 'HNW', ring: 3, angle: 135, color: RING_COLORS.audience, radius: 1.0, description: 'High-Net-Worth', filterType: 'audience', filterValue: 'high-net-worth' },
  { id: 'students', label: 'Students', ring: 3, angle: 180, color: RING_COLORS.audience, radius: 1.0, description: 'Students', filterType: 'audience', filterValue: 'students' },
  { id: 'retirees', label: 'Retirees', ring: 3, angle: 225, color: RING_COLORS.audience, radius: 1.0, description: 'Retirees', filterType: 'audience', filterValue: 'retirees' },
  { id: 'business-owners', label: 'Biz Owners', ring: 3, angle: 270, color: RING_COLORS.audience, radius: 1.0, description: 'Business Owners', filterType: 'audience', filterValue: 'business-owners' },
  { id: 'mass-market', label: 'Mass Market', ring: 3, angle: 315, color: RING_COLORS.audience, radius: 1.0, description: 'Mass Market', filterType: 'audience', filterValue: 'mass-market' },

  // Ring 4 — Campaigns (19 nodes, ~19° intervals)
  { id: 'rbc-avion-travel-q1', label: 'Avion Travel Q1', ring: 4, angle: 0, color: RING_COLORS.campaign, radius: 0.8, description: 'Avion Travel Rewards — Q1 Push', filterType: 'campaign', filterValue: 'rbc-avion-travel-q1' },
  { id: 'rbc-avion-points-accel', label: 'Avion Points', ring: 4, angle: 19, color: RING_COLORS.campaign, radius: 0.8, description: 'Avion Points Accelerator', filterType: 'campaign', filterValue: 'rbc-avion-points-accel' },
  { id: 'rbc-avion-retention', label: 'Avion Retain', ring: 4, angle: 38, color: RING_COLORS.campaign, radius: 0.8, description: 'Avion Cardholder Retention', filterType: 'campaign', filterValue: 'rbc-avion-retention' },
  { id: 'rbc-ion-launch', label: 'ION Launch', ring: 4, angle: 57, color: RING_COLORS.campaign, radius: 0.8, description: 'ION Card Digital Launch', filterType: 'campaign', filterValue: 'rbc-ion-launch' },
  { id: 'rbc-ion-student', label: 'ION Student', ring: 4, angle: 76, color: RING_COLORS.campaign, radius: 0.8, description: 'ION Student Crossover', filterType: 'campaign', filterValue: 'rbc-ion-student' },
  { id: 'rbc-rewards-awareness', label: 'Rewards Aware', ring: 4, angle: 95, color: RING_COLORS.campaign, radius: 0.8, description: 'RBC Rewards Brand Awareness', filterType: 'campaign', filterValue: 'rbc-rewards-awareness' },
  { id: 'rbc-mortgage-spring', label: 'Mortgage Spring', ring: 4, angle: 114, color: RING_COLORS.campaign, radius: 0.8, description: 'Spring Mortgage Rates', filterType: 'campaign', filterValue: 'rbc-mortgage-spring' },
  { id: 'rbc-mortgage-ftb', label: 'Mortgage FTB', ring: 4, angle: 133, color: RING_COLORS.campaign, radius: 0.8, description: 'First-Time Home Buyer', filterType: 'campaign', filterValue: 'rbc-mortgage-ftb' },
  { id: 'rbc-di-tfsa', label: 'TFSA Push', ring: 4, angle: 152, color: RING_COLORS.campaign, radius: 0.8, description: 'TFSA Season Push', filterType: 'campaign', filterValue: 'rbc-di-tfsa' },
  { id: 'rbc-di-active-trader', label: 'Active Trader', ring: 4, angle: 171, color: RING_COLORS.campaign, radius: 0.8, description: 'Active Trader Acquisition', filterType: 'campaign', filterValue: 'rbc-di-active-trader' },
  { id: 'rbc-ds-hnw', label: 'HNW Advisory', ring: 4, angle: 190, color: RING_COLORS.campaign, radius: 0.8, description: 'HNW Wealth Advisory', filterType: 'campaign', filterValue: 'rbc-ds-hnw' },
  { id: 'rbc-insurance-bundle', label: 'Ins. Bundle', ring: 4, angle: 209, color: RING_COLORS.campaign, radius: 0.8, description: 'Home & Auto Insurance Bundle', filterType: 'campaign', filterValue: 'rbc-insurance-bundle' },
  { id: 'rbc-student-bts', label: 'Student BTS', ring: 4, angle: 228, color: RING_COLORS.campaign, radius: 0.8, description: 'Back to School Banking 2026', filterType: 'campaign', filterValue: 'rbc-student-bts' },
  { id: 'rbc-newcomer-welcome', label: 'Newcomer Welcome', ring: 4, angle: 247, color: RING_COLORS.campaign, radius: 0.8, description: 'Welcome to Canada', filterType: 'campaign', filterValue: 'rbc-newcomer-welcome' },
  { id: 'rbc-smb-growth', label: 'SMB Growth', ring: 4, angle: 266, color: RING_COLORS.campaign, radius: 0.8, description: 'Small Business Growth', filterType: 'campaign', filterValue: 'rbc-smb-growth' },
  { id: 'rbc-cml-commercial', label: 'Comm. Lending', ring: 4, angle: 285, color: RING_COLORS.campaign, radius: 0.8, description: 'Commercial Lending', filterType: 'campaign', filterValue: 'rbc-cml-commercial' },
  { id: 'rbc-gic-rates', label: 'GIC Rates', ring: 4, angle: 304, color: RING_COLORS.campaign, radius: 0.8, description: 'GIC Rate Promotion', filterType: 'campaign', filterValue: 'rbc-gic-rates' },
  { id: 'rbc-gameday-moments', label: 'Game Day', ring: 4, angle: 323, color: RING_COLORS.campaign, radius: 0.8, description: 'Game Day Moments', filterType: 'campaign', filterValue: 'rbc-gameday-moments' },
  { id: 'rbc-brand-q1', label: 'Brand Q1', ring: 4, angle: 342, color: RING_COLORS.campaign, radius: 0.8, description: 'RBC Master Brand — Q1', filterType: 'campaign', filterValue: 'rbc-brand-q1' },

  // Ring 5 — Execution (9 channels + 3 funnel + 4 geos = 16 nodes)
  { id: 'ch-instagram', label: 'Instagram', ring: 5, angle: 0, color: RING_COLORS.exec, radius: 0.9, description: 'Instagram', filterType: 'channel', filterValue: 'instagram' },
  { id: 'ch-facebook', label: 'Facebook', ring: 5, angle: 22.5, color: RING_COLORS.exec, radius: 0.9, description: 'Facebook', filterType: 'channel', filterValue: 'facebook' },
  { id: 'ch-tiktok', label: 'TikTok', ring: 5, angle: 45, color: RING_COLORS.exec, radius: 0.9, description: 'TikTok', filterType: 'channel', filterValue: 'tiktok' },
  { id: 'ch-google-search', label: 'Google Search', ring: 5, angle: 67.5, color: RING_COLORS.exec, radius: 0.9, description: 'Google Search', filterType: 'channel', filterValue: 'google-search' },
  { id: 'ch-ttd', label: 'Trade Desk', ring: 5, angle: 90, color: RING_COLORS.exec, radius: 0.9, description: 'The Trade Desk', filterType: 'channel', filterValue: 'ttd' },
  { id: 'ch-ctv', label: 'CTV', ring: 5, angle: 112.5, color: RING_COLORS.exec, radius: 0.9, description: 'Connected TV', filterType: 'channel', filterValue: 'ctv' },
  { id: 'ch-spotify', label: 'Spotify', ring: 5, angle: 135, color: RING_COLORS.exec, radius: 0.9, description: 'Spotify', filterType: 'channel', filterValue: 'spotify' },
  { id: 'ch-linkedin', label: 'LinkedIn', ring: 5, angle: 157.5, color: RING_COLORS.exec, radius: 0.9, description: 'LinkedIn', filterType: 'channel', filterValue: 'linkedin' },
  { id: 'ch-ooh', label: 'OOH', ring: 5, angle: 180, color: RING_COLORS.exec, radius: 0.9, description: 'Out-of-Home', filterType: 'channel', filterValue: 'ooh' },
  { id: 'fn-awareness', label: 'Awareness', ring: 5, angle: 210, color: RING_COLORS.exec, radius: 0.9, description: 'Awareness Objective', filterType: 'funnel', filterValue: 'awareness' },
  { id: 'fn-consideration', label: 'Consideration', ring: 5, angle: 232.5, color: RING_COLORS.exec, radius: 0.9, description: 'Consideration Objective', filterType: 'funnel', filterValue: 'consideration' },
  { id: 'fn-conversion', label: 'Conversion', ring: 5, angle: 255, color: RING_COLORS.exec, radius: 0.9, description: 'Conversion Objective', filterType: 'funnel', filterValue: 'conversion' },
  { id: 'geo-national', label: 'National', ring: 5, angle: 285, color: RING_COLORS.exec, radius: 0.9, description: 'National', filterType: 'geo', filterValue: 'national' },
  { id: 'geo-ontario', label: 'Ontario', ring: 5, angle: 307.5, color: RING_COLORS.exec, radius: 0.9, description: 'Ontario', filterType: 'geo', filterValue: 'ontario' },
  { id: 'geo-quebec', label: 'Quebec', ring: 5, angle: 330, color: RING_COLORS.exec, radius: 0.9, description: 'Quebec', filterType: 'geo', filterValue: 'quebec' },
  { id: 'geo-western', label: 'Western', ring: 5, angle: 352.5, color: RING_COLORS.exec, radius: 0.9, description: 'Western Canada', filterType: 'geo', filterValue: 'western' },
];

// ===== Bond Definitions =====

const BONDS: MolecularBond[] = [
  // Ring 0→1: RBC to all org nodes
  ...['pcb', 'wealth', 'insurance', 'capital-markets', 'omnicom', 'publicis', 'wpp', 'in-house', 'other'].map(t => ({ source: 'rbc', target: t })),

  // Ring 1→2: Divisions own product lines
  ...['avion', 'ion', 'rewards', 'mortgage', 'student', 'newcomer', 'small-business', 'gic-savings'].map(t => ({ source: 'pcb', target: t })),
  ...['direct-investing', 'dominion-securities', 'gic-savings'].map(t => ({ source: 'wealth', target: t })),
  { source: 'insurance', target: 'insurance-products' },
  { source: 'capital-markets', target: 'commercial-lending' },

  // Ring 1→2: Agencies manage product lines
  ...['avion', 'ion', 'mortgage', 'rewards', 'student'].map(t => ({ source: 'omnicom', target: t })),
  ...['direct-investing', 'dominion-securities', 'insurance-products'].map(t => ({ source: 'publicis', target: t })),
  ...['newcomer', 'small-business', 'commercial-lending'].map(t => ({ source: 'wpp', target: t })),
  ...['rewards', 'gic-savings'].map(t => ({ source: 'in-house', target: t })),

  // Ring 2→3: Products target audiences
  ...['young-professionals', 'families', 'high-net-worth'].map(t => ({ source: 'avion', target: t })),
  ...['young-professionals', 'students'].map(t => ({ source: 'ion', target: t })),
  ...['young-professionals', 'families', 'mass-market'].map(t => ({ source: 'rewards', target: t })),
  ...['families', 'young-professionals'].map(t => ({ source: 'mortgage', target: t })),
  ...['young-professionals', 'high-net-worth', 'retirees'].map(t => ({ source: 'direct-investing', target: t })),
  ...['high-net-worth', 'retirees'].map(t => ({ source: 'dominion-securities', target: t })),
  ...['families', 'mass-market'].map(t => ({ source: 'insurance-products', target: t })),
  { source: 'student', target: 'students' },
  { source: 'newcomer', target: 'new-canadians' },
  { source: 'small-business', target: 'business-owners' },
  { source: 'commercial-lending', target: 'business-owners' },
  ...['retirees', 'mass-market'].map(t => ({ source: 'gic-savings', target: t })),

  // Ring 3→4: Audiences to campaigns (derived from campaign audience data)
  ...['young-professionals', 'families', 'high-net-worth'].map(t => ({ source: t, target: 'rbc-avion-travel-q1' })),
  ...['young-professionals', 'families', 'mass-market'].map(t => ({ source: t, target: 'rbc-avion-points-accel' })),
  ...['young-professionals', 'families', 'high-net-worth'].map(t => ({ source: t, target: 'rbc-avion-retention' })),
  ...['young-professionals', 'students'].map(t => ({ source: t, target: 'rbc-ion-launch' })),
  { source: 'students', target: 'rbc-ion-student' },
  ...['mass-market', 'young-professionals', 'families'].map(t => ({ source: t, target: 'rbc-rewards-awareness' })),
  ...['families', 'young-professionals'].map(t => ({ source: t, target: 'rbc-mortgage-spring' })),
  { source: 'young-professionals', target: 'rbc-mortgage-ftb' },
  ...['young-professionals', 'high-net-worth', 'retirees'].map(t => ({ source: t, target: 'rbc-di-tfsa' })),
  ...['young-professionals', 'high-net-worth'].map(t => ({ source: t, target: 'rbc-di-active-trader' })),
  ...['high-net-worth', 'retirees'].map(t => ({ source: t, target: 'rbc-ds-hnw' })),
  ...['families', 'mass-market'].map(t => ({ source: t, target: 'rbc-insurance-bundle' })),
  { source: 'students', target: 'rbc-student-bts' },
  { source: 'new-canadians', target: 'rbc-newcomer-welcome' },
  { source: 'business-owners', target: 'rbc-smb-growth' },
  { source: 'business-owners', target: 'rbc-cml-commercial' },
  ...['retirees', 'mass-market'].map(t => ({ source: t, target: 'rbc-gic-rates' })),
  ...['young-professionals', 'families', 'mass-market'].map(t => ({ source: t, target: 'rbc-gameday-moments' })),
  ...['mass-market', 'young-professionals', 'families'].map(t => ({ source: t, target: 'rbc-brand-q1' })),

  // Ring 4→5: Campaigns to channels
  ...['ch-instagram', 'ch-facebook', 'ch-google-search', 'ch-ctv', 'ch-ttd', 'ch-ooh', 'ch-spotify'].map(t => ({ source: 'rbc-avion-travel-q1', target: t })),
  ...['ch-instagram', 'ch-facebook', 'ch-google-search'].map(t => ({ source: 'rbc-avion-points-accel', target: t })),
  ...['ch-instagram', 'ch-facebook', 'ch-google-search'].map(t => ({ source: 'rbc-avion-retention', target: t })),
  ...['ch-tiktok', 'ch-instagram', 'ch-facebook', 'ch-spotify', 'ch-google-search'].map(t => ({ source: 'rbc-ion-launch', target: t })),
  ...['ch-tiktok', 'ch-instagram', 'ch-facebook', 'ch-spotify'].map(t => ({ source: 'rbc-ion-student', target: t })),
  ...['ch-instagram', 'ch-facebook', 'ch-ctv', 'ch-spotify'].map(t => ({ source: 'rbc-rewards-awareness', target: t })),
  ...['ch-google-search', 'ch-instagram', 'ch-facebook', 'ch-ctv', 'ch-ttd'].map(t => ({ source: 'rbc-mortgage-spring', target: t })),
  ...['ch-google-search', 'ch-instagram', 'ch-facebook', 'ch-linkedin'].map(t => ({ source: 'rbc-mortgage-ftb', target: t })),
  ...['ch-google-search', 'ch-instagram', 'ch-facebook', 'ch-linkedin'].map(t => ({ source: 'rbc-di-tfsa', target: t })),
  ...['ch-google-search', 'ch-instagram', 'ch-facebook', 'ch-tiktok'].map(t => ({ source: 'rbc-di-active-trader', target: t })),
  ...['ch-linkedin', 'ch-ctv', 'ch-ooh'].map(t => ({ source: 'rbc-ds-hnw', target: t })),
  ...['ch-google-search', 'ch-instagram', 'ch-facebook', 'ch-ctv'].map(t => ({ source: 'rbc-insurance-bundle', target: t })),
  ...['ch-tiktok', 'ch-instagram', 'ch-facebook', 'ch-spotify'].map(t => ({ source: 'rbc-student-bts', target: t })),
  ...['ch-google-search', 'ch-instagram', 'ch-facebook', 'ch-linkedin'].map(t => ({ source: 'rbc-newcomer-welcome', target: t })),
  ...['ch-google-search', 'ch-linkedin', 'ch-instagram', 'ch-facebook'].map(t => ({ source: 'rbc-smb-growth', target: t })),
  ...['ch-linkedin', 'ch-google-search'].map(t => ({ source: 'rbc-cml-commercial', target: t })),
  ...['ch-google-search', 'ch-instagram', 'ch-facebook'].map(t => ({ source: 'rbc-gic-rates', target: t })),
  ...['ch-instagram', 'ch-facebook', 'ch-ctv', 'ch-tiktok', 'ch-ooh', 'ch-spotify'].map(t => ({ source: 'rbc-gameday-moments', target: t })),
  ...['ch-instagram', 'ch-facebook', 'ch-ctv', 'ch-google-search', 'ch-ooh', 'ch-spotify'].map(t => ({ source: 'rbc-brand-q1', target: t })),

  // Ring 4→5: Campaigns to funnel objectives (retention maps to conversion)
  { source: 'rbc-avion-travel-q1', target: 'fn-awareness' },
  { source: 'rbc-avion-points-accel', target: 'fn-conversion' },
  { source: 'rbc-avion-retention', target: 'fn-conversion' },  // retention → conversion
  { source: 'rbc-ion-launch', target: 'fn-awareness' },
  { source: 'rbc-ion-student', target: 'fn-consideration' },
  { source: 'rbc-rewards-awareness', target: 'fn-awareness' },
  { source: 'rbc-mortgage-spring', target: 'fn-conversion' },
  { source: 'rbc-mortgage-ftb', target: 'fn-consideration' },
  { source: 'rbc-di-tfsa', target: 'fn-conversion' },
  { source: 'rbc-di-active-trader', target: 'fn-consideration' },
  { source: 'rbc-ds-hnw', target: 'fn-consideration' },
  { source: 'rbc-insurance-bundle', target: 'fn-conversion' },
  { source: 'rbc-student-bts', target: 'fn-awareness' },
  { source: 'rbc-newcomer-welcome', target: 'fn-awareness' },
  { source: 'rbc-smb-growth', target: 'fn-consideration' },
  { source: 'rbc-cml-commercial', target: 'fn-consideration' },
  { source: 'rbc-gic-rates', target: 'fn-conversion' },
  { source: 'rbc-gameday-moments', target: 'fn-awareness' },
  { source: 'rbc-brand-q1', target: 'fn-awareness' },

  // Ring 4→5: Campaigns to geos
  ...['rbc-avion-travel-q1', 'rbc-avion-points-accel', 'rbc-avion-retention', 'rbc-ion-launch',
    'rbc-rewards-awareness', 'rbc-mortgage-spring', 'rbc-di-tfsa', 'rbc-di-active-trader',
    'rbc-insurance-bundle', 'rbc-newcomer-welcome', 'rbc-smb-growth', 'rbc-cml-commercial',
    'rbc-gic-rates', 'rbc-gameday-moments', 'rbc-brand-q1'].map(s => ({ source: s, target: 'geo-national' })),
  ...['rbc-ion-student', 'rbc-student-bts'].map(s => ({ source: s, target: 'geo-ontario' })),
  ...['rbc-ion-student', 'rbc-student-bts'].map(s => ({ source: s, target: 'geo-quebec' })),
  ...['rbc-mortgage-ftb', 'rbc-ds-hnw'].map(s => ({ source: s, target: 'geo-ontario' })),
  ...['rbc-mortgage-ftb', 'rbc-ds-hnw'].map(s => ({ source: s, target: 'geo-western' })),
];

// ===== Exports =====

export const MOLECULAR_NODES = NODES;
export const MOLECULAR_BONDS = BONDS;

// Compute Fibonacci sphere positions for all nodes
computeBasePositions(NODES);

// Build adjacency maps for fast lookup
const nodeMap = new Map<string, MolecularNode>();
for (const n of NODES) nodeMap.set(n.id, n);

const adjacency = new Map<string, Set<string>>();
for (const b of BONDS) {
  if (!adjacency.has(b.source)) adjacency.set(b.source, new Set());
  if (!adjacency.has(b.target)) adjacency.set(b.target, new Set());
  adjacency.get(b.source)!.add(b.target);
  adjacency.get(b.target)!.add(b.source);
}

function bondKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function getNode(id: string): MolecularNode | undefined {
  return nodeMap.get(id);
}

export function traceLineage(
  selectedIds: Set<string>,
  nodes: MolecularNode[] = NODES,
  bonds: MolecularBond[] = BONDS,
): { litNodes: Set<string>; litBonds: Set<string> } {
  if (selectedIds.size === 0) return { litNodes: new Set(), litBonds: new Set() };

  // Group selections by ring
  const selectionsByRing = new Map<number, string[]>();
  for (const id of selectedIds) {
    const node = nodeMap.get(id);
    if (!node) continue;
    if (!selectionsByRing.has(node.ring)) selectionsByRing.set(node.ring, []);
    selectionsByRing.get(node.ring)!.push(id);
  }

  // For each selection, trace upstream + downstream
  function traceDirection(startId: string, direction: 'upstream' | 'downstream'): { nodes: Set<string>; bonds: Set<string> } {
    const visited = new Set<string>();
    const visitedBonds = new Set<string>();
    const queue = [startId];
    visited.add(startId);

    const startRing = nodeMap.get(startId)?.ring ?? 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentRing = nodeMap.get(current)?.ring ?? 0;
      const neighbors = adjacency.get(current);
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        const neighborRing = nodeMap.get(neighbor)?.ring ?? 0;
        const isUpstream = direction === 'upstream' && neighborRing < currentRing;
        const isDownstream = direction === 'downstream' && neighborRing > currentRing;

        if ((isUpstream || isDownstream) && !visited.has(neighbor)) {
          visited.add(neighbor);
          visitedBonds.add(bondKey(current, neighbor));
          queue.push(neighbor);
        }
      }
    }
    return { nodes: visited, bonds: visitedBonds };
  }

  // Combine per selection
  // Same-ring = union (OR), cross-ring = intersection (AND) for downstream
  const allLitNodes = new Set<string>();
  const allLitBonds = new Set<string>();

  // Upstream: always union
  for (const id of selectedIds) {
    const upstream = traceDirection(id, 'upstream');
    for (const n of upstream.nodes) allLitNodes.add(n);
    for (const b of upstream.bonds) allLitBonds.add(b);
  }

  // Downstream: AND across rings, OR within same ring
  const rings = Array.from(selectionsByRing.keys()).sort((a, b) => a - b);
  let downstreamNodeSets: Set<string>[] | null = null;
  let downstreamBondSets: Set<string>[] | null = null;

  for (const ring of rings) {
    const idsInRing = selectionsByRing.get(ring)!;
    // Union within this ring
    const ringNodes = new Set<string>();
    const ringBonds = new Set<string>();
    for (const id of idsInRing) {
      const downstream = traceDirection(id, 'downstream');
      for (const n of downstream.nodes) ringNodes.add(n);
      for (const b of downstream.bonds) ringBonds.add(b);
    }

    if (downstreamNodeSets === null) {
      downstreamNodeSets = [ringNodes];
      downstreamBondSets = [ringBonds];
    } else {
      downstreamNodeSets.push(ringNodes);
      downstreamBondSets!.push(ringBonds);
    }
  }

  // Intersect across rings
  if (downstreamNodeSets && downstreamNodeSets.length > 0) {
    let intersectedNodes = downstreamNodeSets[0];
    for (let i = 1; i < downstreamNodeSets.length; i++) {
      const next = downstreamNodeSets[i];
      intersectedNodes = new Set([...intersectedNodes].filter(n => next.has(n)));
    }
    for (const n of intersectedNodes) allLitNodes.add(n);

    // Re-derive bonds: only include bonds where both endpoints are in the final lit set
    for (const bondSet of downstreamBondSets!) {
      for (const bk of bondSet) {
        const [a, b] = bk.split('|');
        if (allLitNodes.has(a) && allLitNodes.has(b)) {
          allLitBonds.add(bk);
        }
      }
    }
  }

  // Always include selected nodes themselves
  for (const id of selectedIds) allLitNodes.add(id);

  return { litNodes: allLitNodes, litBonds: allLitBonds };
}
