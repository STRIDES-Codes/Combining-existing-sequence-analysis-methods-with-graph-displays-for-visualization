"""Reads in local metadata file and outputs structured 
tab-separated file with delineated location data and accession number"""

# Import relevant libraries

import pandas as pd  # For dataframe manipulation
import re  # For splitting complex string combinations

# Read in metadata from local file

metadata_df = pd.read_csv("/genbank/metadata/2697049_metadata.tsv", sep="\t")

# Save accession numbers as df to be merged later
# Save geolocations as df with NaNs filled as 'None' (for regex purposes)
# Save geolocations as list for manipulation

accession_df = pd.DataFrame(df["Accession"])
geolocations_series = df["Geo_Location"].fillna("None")
geolocations_list = geolocations_series.tolist()

# Make geolocation tuples list with regex separated rules on : and ,

geolocations_tuples = [tuple(re.split(": |, ", i)) for i in geolocations_list]

# Save new DataFrame of geolocations with locX
# delineated locations (i.e., loc1, loc2 etc.)

geolocations_df = pd.DataFrame(geolocations_tuples, columns=["loc1", "loc2", "loc3"])

# Join with accession_df and export to tsv file named geolocations+accessions.tsv

accession_df.join(geolocation_df).to_csv("/data/geolocations+accession.tsv", sep="\t")