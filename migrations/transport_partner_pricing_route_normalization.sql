-- Normalize legacy transport pricing route IDs created by the early partner portal UI.
-- The UI now uses the same hyphenated route IDs as booking transport requests.

UPDATE transport_partner_pricing
SET
  route = CASE route
    WHEN 'lilongwe_dzaleka' THEN 'lilongwe-dzaleka'
    WHEN 'airport_dzaleka' THEN 'airport-dzaleka'
    WHEN 'lilongwe_dzaleka_lake_malawi' THEN 'lilongwe-dzaleka-lake-malawi'
    WHEN 'custom' THEN 'custom-route'
    WHEN 'custom_route' THEN 'custom-route'
    ELSE route
  END,
  label = CASE
    WHEN route IN ('airport_dzaleka', 'airport-dzaleka') AND (label IS NULL OR label = '' OR label = 'Lilongwe round trip') THEN 'Airport pickup'
    WHEN route IN ('lilongwe_dzaleka_lake_malawi', 'lilongwe-dzaleka-lake-malawi') AND (label IS NULL OR label = '' OR label = 'Lilongwe round trip') THEN 'Dzaleka + Lake Malawi'
    WHEN route IN ('custom', 'custom_route', 'custom-route') AND (label IS NULL OR label = '' OR label = 'Lilongwe round trip') THEN 'Custom route'
    WHEN route IN ('lilongwe_dzaleka', 'lilongwe-dzaleka') AND (label IS NULL OR label = '') THEN 'Lilongwe round trip'
    ELSE label
  END,
  updated_at = now()
WHERE route IN (
  'lilongwe_dzaleka',
  'airport_dzaleka',
  'lilongwe_dzaleka_lake_malawi',
  'custom',
  'custom_route',
  'airport-dzaleka',
  'lilongwe-dzaleka-lake-malawi',
  'custom-route',
  'lilongwe-dzaleka'
);
