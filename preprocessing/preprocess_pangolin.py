"""Reads in local pangolin .txt comma-separated file and outputs structured tab-separated file with
accession number and lineage identifier"""

# Import relevant libraries

import pandas as pd  # For dataframe manipulation
import re  # For splitting complex string combinations

# Initialize main() function


def preprocess_pangolin():

    # Read in pangolin text file

    pangolin_df = pd.read_csv("good_seqs_pangolin.txt")

    # Save taxon column to a list
    # Save lineage column to a list

    pangolin_taxon = pangolin_df["taxon"].tolist()
    pangolin_lineage = pangolin_df["lineage"].tolist()

    # Split on the _S in the taxon name to just give accessions and save in list variable

    pangolin_accession = [t.split(r"_S")[0] for t in pangolin_taxon]

    # Make accession list into its own DataFrame
    # Make lineage list into its own DataFrame

    pangolin_accession_df = pd.DataFrame(pangolin_accession, columns=["Accession"])
    pangolin_lineage_df = pd.DataFrame(pangolin_lineage, columns=["Lineage"])

    # Join the accession and lineage list and save to a tsv in the local data dir

    pangolin_accession_df.join(pangolin_lineage_df).to_csv(
        "/data/lineage+accession.tsv", sep="\t"
    )


if __name__ == "__main__":
    preprocess_pangolin()
