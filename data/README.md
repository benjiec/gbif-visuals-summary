# GBIF Data Queries

This directory contains data files generated from queries against the GBIF public dataset (`bigquery-public-data.gbif.occurrences`). The queries follow the Darwin Core standard for taxonomic data.

## Query 1: Total Occurrences and Individual Counts by Phylum

This query aggregates occurrence and individual counts for each phylum, grouped by kingdom:

```sql
SELECT 
  phylum,
  kingdom,
  COUNT(*) as occurrence_count,
  SUM(CAST(individualcount AS INT64)) as individual_count
FROM `bigquery-public-data.gbif.occurrences`
WHERE phylum IS NOT NULL 
  AND occurrencestatus = 'PRESENT'
GROUP BY phylum, kingdom
ORDER BY phylum;
```

Output: [phyla.csv](phyla.csv)

## Query 2: Top 3 Countries by Occurrences for Each Phylum

This query identifies the three countries with the most occurrences for each phylum:

```sql
WITH RankedPhylaByCountry AS (
  SELECT 
    phylum,
    countrycode as country,
    COUNT(*) as occurrence_count,
    ROW_NUMBER() OVER (PARTITION BY phylum ORDER BY COUNT(*) DESC) as rank
  FROM `bigquery-public-data.gbif.occurrences`
  WHERE phylum IS NOT NULL 
    AND countrycode IS NOT NULL
    AND occurrencestatus = 'PRESENT'
  GROUP BY phylum, countrycode
)
SELECT 
  phylum,
  country,
  occurrence_count,
  rank
FROM RankedPhylaByCountry
WHERE rank <= 3
ORDER BY phylum, rank;
```

Output: [phyla-country.csv](phyla-country.csv)

## Query 3: Top 5 Species by Occurrences for Each Phylum

This query finds the five most frequently observed species within each phylum:

```sql
WITH SpeciesRanks AS (
  SELECT 
    species,
    phylum,
    COUNT(*) as occurrence_count,
    ROW_NUMBER() OVER (PARTITION BY phylum ORDER BY COUNT(*) DESC) as rank
  FROM `bigquery-public-data.gbif.occurrences`
  WHERE species IS NOT NULL 
    AND phylum IS NOT NULL
    AND occurrencestatus = 'PRESENT'
  GROUP BY species, phylum
)
SELECT 
  species,
  phylum,
  occurrence_count,
  rank
FROM SpeciesRanks
WHERE rank <= 5
ORDER BY phylum, rank;
```

Output: [species.csv](species.csv)

## Query 4: Kingdom Distribution by Phylum

This query shows the distribution of kingdoms for each phylum:

```sql
SELECT 
  phylum,
  kingdom,
  COUNT(*) as occurrence_count,
  SUM(CAST(individualcount AS INT64)) as individual_count
FROM `bigquery-public-data.gbif.occurrences`
WHERE phylum IS NOT NULL 
  AND kingdom IS NOT NULL
  AND occurrencestatus = 'PRESENT'
GROUP BY phylum, kingdom
ORDER BY phylum, kingdom;
```

Output: [kingdom.csv](kingdom.csv)

## Notes

- All queries filter for `occurrencestatus = 'PRESENT'` to exclude absence records
- The occurrence count represents the number of observations, not the number of individual organisms
- The individual count is the sum of the `individualcount` field, which may be null in some records
- Country codes follow the ISO 3166-1 alpha-2 standard
- Some phyla may have fewer than 3 countries/species if observations are limited
- Kingdom classifications may vary based on different taxonomic systems 