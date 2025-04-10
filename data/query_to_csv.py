#!/usr/bin/env python3
import os
import csv
from google.cloud import bigquery
from google.oauth2 import service_account
import argparse
import sys

def setup_client(key_path, project_id):
    """Setup BigQuery client with service account credentials"""
    credentials = service_account.Credentials.from_service_account_file(
        key_path,
        scopes=["https://www.googleapis.com/auth/bigquery"]
    )
    return bigquery.Client(credentials=credentials, project=project_id)

def run_query(client, query):
    """Execute query and return results"""
    query_job = client.query(query)
    return query_job.result()

def save_to_csv(results, output_path):
    """Save query results to CSV file"""
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Get the schema field names
    field_names = [field.name for field in results.schema]
    
    with open(output_path, 'w', newline='') as f:
        writer = csv.writer(f)
        # Write header
        writer.writerow(field_names)
        # Write data
        for row in results:
            writer.writerow([row[field] for field in field_names])

def get_queries():
    """Return dictionary of all queries to run"""
    return {
        "phyla.csv": """
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
        """,
        
        "phyla-country.csv": """
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
        """,
        
        "species.csv": """
            WITH SpeciesRanks AS (
              SELECT 
                phylum,
                species,
                COUNT(*) as occurrence_count,
                SUM(CAST(individualcount AS INT64)) as individual_count,
                ROW_NUMBER() OVER (PARTITION BY phylum ORDER BY COUNT(*) DESC) as rank
              FROM `bigquery-public-data.gbif.occurrences`
              WHERE species IS NOT NULL 
                AND phylum IS NOT NULL
                AND occurrencestatus = 'PRESENT'
              GROUP BY phylum, species
            )
            SELECT 
              phylum,
              species,
              occurrence_count,
              individual_count
            FROM SpeciesRanks
            WHERE rank <= 5
            ORDER BY phylum, rank;
        """,
        
        "kingdom.csv": """
            SELECT 
              COALESCE(kingdom, 'incertae sedis') as kingdom,
              COUNT(*) as occurrence_count,
              SUM(CAST(individualcount AS INT64)) as individual_count
            FROM `bigquery-public-data.gbif.occurrences`
            WHERE occurrencestatus = 'PRESENT'
            GROUP BY kingdom
            ORDER BY kingdom;
        """
    }

def main():
    parser = argparse.ArgumentParser(description='Generate GBIF statistics CSV files')
    parser.add_argument('--key-file', required=True, help='Path to service account key file')
    parser.add_argument('--project-id', required=True, help='Google Cloud project ID')
    args = parser.parse_args()

    try:
        # Setup BigQuery client
        client = setup_client(args.key_file, args.project_id)
        
        # Get all queries
        queries = get_queries()
        
        # Run each query and save results
        for filename, query in queries.items():
            print(f"Executing query for {filename}...")
            results = run_query(client, query)
            
            output_path = os.path.join('data', filename)
            print(f"Saving results to {output_path}...")
            save_to_csv(results, output_path)
            print(f"Successfully generated {filename}")
            
        print("All files generated successfully!")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main() 