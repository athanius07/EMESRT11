// netlify/functions/_shared/dataset.js

function rows() {
  // Curated seed dataset (can be extended with real scrapers later)
  // Fields: Jurisdiction/Body, Country, Title, Type, Publication Date, Status, EMESRT Scope (L7/L8/L9)?, URL, Notes
  return [
    {
      'Jurisdiction/Body': 'South Africa – Department of Mineral Resources & Energy (DMRE)',
      Country: 'South Africa',
      Title: 'Mine Health and Safety Act: Trackless Mobile Machinery – Commencement of sub-regulations 8.10.1.2(b) and 8.10.2.1(b)',
      Type: 'Government mandate',
      'Publication Date': '2022-12-21',
      Status: 'In force',
      'EMESRT Scope (L7/L8/L9)?': 'L9',
      URL: 'https://www.gov.za/sites/default/files/gcis_document/202212/47790gon2908.pdf',
      Notes: 'Mandates automatic retard/stop for diesel TMMs when no action taken to prevent collision.'
    },
    {
      'Jurisdiction/Body': 'US Department of Labor – MSHA (Federal Register)',
      Country: 'United States',
      Title: 'Proximity Detection Systems for Continuous Mining Machines in Underground Coal Mines',
      Type: 'Government mandate',
      'Publication Date': '2015-01-15',
      Status: 'Final Rule (effective 2015-03-16)',
      'EMESRT Scope (L7/L8/L9)?': 'L7|L8',
      URL: 'https://www.federalregister.gov/documents/2015/01/15/2015-00319/proximity-detection-systems-for-continuous-mining-machines-in-underground-coal-mines',
      Notes: '30 CFR §75.1732; phased compliance by machine vintage.'
    },
    {
      'Jurisdiction/Body': 'US Department of Labor – MSHA',
      Country: 'United States',
      Title: "MSHA News Release: 'Proximity detection final rule will save miners\' lives'",
      Type: 'Government mandate',
      'Publication Date': '2015-01-13',
      Status: 'Announcement',
      'EMESRT Scope (L7/L8/L9)?': 'L7|L8',
      URL: 'https://www.dol.gov/newsroom/releases/msha/msha20150035',
      Notes: ''
    },
    {
      'Jurisdiction/Body': 'Resources Safety & Health Queensland (RSHQ)',
      Country: 'Australia',
      Title: 'Guidance Note QGN 27 – Collision Prevention (Revision 2)',
      Type: 'Sub-national guidance',
      'Publication Date': '2024-04-01',
      Status: 'Guidance Note',
      'EMESRT Scope (L7/L8/L9)?': 'General CAS',
      URL: 'https://www.resources.qld.gov.au/__data/assets/pdf_file/0007/1346821/qld-guidance-note-27.pdf',
      Notes: 'Technology types, traffic management, stopping distances, bowties.'
    },
    {
      'Jurisdiction/Body': 'NSW Resources Regulator',
      Country: 'Australia',
      Title: 'MDG 2007 – Guideline for the selection and implementation of collision management systems for mining',
      Type: 'Sub-national guidance',
      'Publication Date': '2014-02-01',
      Status: 'Guideline',
      'EMESRT Scope (L7/L8/L9)?': 'General CAS',
      URL: 'https://www.resources.nsw.gov.au/sites/default/files/documents/mdg-2007-guideline-for-the-selection-and-implementation-of-collision-management-systems-for-mining-2014.pdf',
      Notes: ''
    },
    {
      'Jurisdiction/Body': 'WorkSafe WA – Department of Energy, Mines, Industry Regulation and Safety',
      Country: 'Australia',
      Title: 'Safe mobile autonomous mining in Western Australia – Code of practice',
      Type: 'Sub-national guidance',
      'Publication Date': '2025-02-15',
      Status: 'Code of practice',
      'EMESRT Scope (L7/L8/L9)?': 'General CAS',
      URL: 'https://www.worksafe.wa.gov.au/publications/safe-mobile-autonomous-mining-western-australia-code-practice',
      Notes: 'Covers integration of autonomous/semi-autonomous mobile systems and traffic risk.'
    },
    {
      'Jurisdiction/Body': 'International Organization for Standardization (ISO)',
      Country: 'International',
      Title: 'ISO 21815-1:2022 – Earth-moving machinery — Collision warning and avoidance — Part 1: General requirements',
      Type: 'Industry framework/standard',
      'Publication Date': '2022-01-01',
      Status: 'Published',
      'EMESRT Scope (L7/L8/L9)?': 'L7|L8|L9',
      URL: 'https://www.iso.org/standard/77302.html',
      Notes: 'Terminology, performance, testing for warning/advisory/intervention.'
    },
    {
      'Jurisdiction/Body': 'International Council on Mining & Metals (ICMM)',
      Country: 'International',
      Title: 'Innovation for Cleaner, Safer Vehicles (ICSV) – Vehicle interaction and collision avoidance ambition',
      Type: 'Industry framework/standard',
      'Publication Date': '2024-01-01',
      Status: 'Program',
      'EMESRT Scope (L7/L8/L9)?': 'General CAS',
      URL: 'https://www.icmm.com/en-gb/our-work/cleaner-safer-vehicles',
      Notes: 'Ambition to make collision avoidance solutions available at scale; collaboration with EMESRT.'
    },
    {
      'Jurisdiction/Body': 'British Columbia – WorkSafeBC / BC Laws',
      Country: 'Canada',
      Title: 'OHS Regulation – Part 16: Mobile Equipment (general regulatory obligations)',
      Type: 'Sub-national guidance',
      'Publication Date': '2025-03-31',
      Status: 'Regulation (current consolidation)',
      'EMESRT Scope (L7/L8/L9)?': 'General CAS',
      URL: 'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/296_97_13',
      Notes: 'Mobile equipment provisions that underpin traffic management at mines in BC.'
    }
  ].sort((a,b)=> (b['Publication Date']||'').localeCompare(a['Publication Date']||''));
}

module.exports = { rows };
