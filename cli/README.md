# visit-dzaleka

Command line access to the [Visit Dzaleka](https://visit.dzaleka.com) public API — live tour pricing, camp zones, meeting points, community events and blog content for Dzaleka Refugee Camp in Dowa District, Malawi.

No API key, no signup. Node 18 or newer.

```bash
npx visit-dzaleka pricing
```

## Commands

| Command | What it does |
|---|---|
| `pricing` | Current tour prices by group size |
| `zones` | Camp zones a tour can cover |
| `meeting-points` | Where a guided tour can start |
| `points-of-interest` | Markets, cultural sites and community projects |
| `offers` | Active public discounts |
| `transport` | Operators driving visitors from Lilongwe |
| `events` | Community events (`--upcoming` to filter) |
| `blog` | Published articles and travel guides |
| `search <query>` | Search community services, events and resources |
| `verify <reference>` | Check a booking reference such as `DVS-2024-001` |
| `endpoints` | List every public API operation |

## Options

| Flag | Effect |
|---|---|
| `--json` | Print the raw JSON response |
| `--upcoming` | `events` only: hide past events |
| `--limit <n>` | Limit rows where supported |
| `--base-url <url>` | Point at another deployment |

## Examples

```bash
visit-dzaleka pricing
visit-dzaleka events --upcoming --limit 5
visit-dzaleka pricing --json | jq '.[0].basePrice'
visit-dzaleka verify DVS-2024-001
```

Prices are integers in Malawi Kwacha (MWK) and change without notice — read them live rather than caching.

## For agents

The same data is available as [OpenAPI 3.1](https://visit.dzaleka.com/openapi.json), with [agent guidance at /llms.txt](https://visit.dzaleka.com/llms.txt). See the [developer portal](https://visit.dzaleka.com/developers).

## Licence

MIT
