# GBIF Data Generation

This directory contains data files generated from queries against the GBIF public dataset (`bigquery-public-data.gbif.occurrences`). The queries follow the Darwin Core standard for taxonomic data.

## Setup

1. Install the required Python package:
```bash
pip install google-cloud-bigquery
```

2. You'll need:
   - A Google Cloud service account key file (JSON format)
   - Your Google Cloud project ID with access to BigQuery

## Usage

Run the script to generate all CSV files:
```bash
python data/query_to_csv.py --key-file path/to/your/service-account-key.json --project-id your-project-id
```

## Generated Files

The script generates the following files:
- `phyla.csv`: Total occurrences and individual counts by phylum
- `phyla-country.csv`: Top 3 countries by occurrences for each phylum
- `species.csv`: Top 5 species by occurrence count for each phylum
- `kingdom.csv`: Kingdom distribution by phylum

## Notes

- All queries filter for `occurrencestatus = 'PRESENT'` to exclude absence records
- The occurrence count represents the number of observations, not the number of individual organisms
- The individual count is the sum of the `individualcount` field, which may be null in some records
- Country codes follow the ISO 3166-1 alpha-2 standard
- Some phyla may have fewer than 3 countries/species if observations are limited
- Kingdom classifications may vary based on different taxonomic systems 