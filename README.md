# EMESRT L7/L8/L9 Tracker

Ready-to-deploy Netlify site that lists **government mandates**, **sub-national guidance**, and **industry frameworks/standards** related to EMESRT L7/L8/L9 collision avoidance in mining, grouped by country and date, with links and CSV export.

## What’s included

- `index.html` – single-page UI (toggle categories, load, CSV, notes, changelog)
- `netlify/functions/emesrt.js` – API endpoint used by the UI
- `netlify/functions/refresh.js` – scheduled function to refresh the cached dataset weekly
- `netlify/functions/_shared/dataset.js` – curated seed dataset (extendable)
- `netlify.toml` – sets function dir, enables weekly schedule (Mon 03:00 UTC)
- `package.json` – minimal dependencies

## Deploy (Netlify)

1. **Create a new site** from this folder (connect repo or drag-and-drop).
2. Netlify will install deps and expose the functions at:
   - `/.netlify/functions/emesrt`
   - `/.netlify/functions/refresh`
3. Open the root `index.html` in your deployed site. The UI will call the function, render the table, and allow download of CSV.
4. The **scheduled function** runs weekly to pre-build the cached dataset. You can trigger it manually by visiting `/.netlify/functions/refresh` once after first deploy.

## API parameters

- `cached=1|0` – when `1`, serve the weekly cached dataset from Netlify Blobs
- `include_changelog=1` – include a small change log
- `mandates=1|0` – include national government mandates
- `subnational=1|0` – include state/province guidance
- `frameworks=1|0` – include industry standards/frameworks
- `format=csv` – CSV export

Example: `/.netlify/functions/emesrt?cached=1&mandates=1&subnational=1&frameworks=1&include_changelog=1`

## Extend the dataset

Add new entries to `netlify/functions/_shared/dataset.js` or swap to live scrapers. Each record uses:

```
{
  'Jurisdiction/Body': '...',
  Country: '...',
  Title: '...',
  Type: 'Government mandate' | 'Sub-national guidance' | 'Industry framework/standard',
  'Publication Date': 'YYYY-MM-DD',
  Status: '...',
  'EMESRT Scope (L7/L8/L9)?': 'L7|L8|L9' | 'General CAS',
  URL: 'https://...'
  Notes: '...'
}
```

## References (seed dataset sources)

- South Africa DMRE Gazette 47790 (Dec 21, 2022) – L9 vehicle intervention in law: https://www.gov.za/sites/default/files/gcis_document/202212/47790gon2908.pdf
- US MSHA Final Rule (Jan 15, 2015) – Proximity detection for continuous miners: https://www.federalregister.gov/documents/2015/01/15/2015-00319/proximity-detection-systems-for-continuous-mining-machines-in-underground-coal-mines
- MSHA News Release (Jan 13, 2015): https://www.dol.gov/newsroom/releases/msha/msha20150035
- Queensland RSHQ – QGN27 Collision Prevention (Apr 2024): https://www.resources.qld.gov.au/__data/assets/pdf_file/0007/1346821/qld-guidance-note-27.pdf
- NSW – MDG 2007 Collision Management Systems: https://www.resources.nsw.gov.au/sites/default/files/documents/mdg-2007-guideline-for-the-selection-and-implementation-of-collision-management-systems-for-mining-2014.pdf
- Western Australia – Safe mobile autonomous mining (Feb 2025): https://www.worksafe.wa.gov.au/publications/safe-mobile-autonomous-mining-western-australia-code-practice
- ISO 21815-1:2022 Collision warning & avoidance: https://www.iso.org/standard/77302.html
- ICMM – Innovation for Cleaner, Safer Vehicles: https://www.icmm.com/en-gb/our-work/cleaner-safer-vehicles
- British Columbia – OHS Regulation, Part 16 Mobile Equipment: https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/296_97_13

## License
MIT
