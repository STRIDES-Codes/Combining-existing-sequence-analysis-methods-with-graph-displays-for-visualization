"""Computes a pairwise distance matrix from a BLAST alignment."""

import argparse
from typing import Dict, List, TextIO


def short_hamming(record: Dict[str, str]) -> float:
    """Compute a normalized hamming distance."""
    len1 = int(record["qlen"])
    len2 = int(record["slen"])
    try:
        ident = float(record["nident"])
    except KeyError:
        ident = float(record["length"]) * float(record["pident"]) / 100.0
    return 1 - ident / min(len1, len2)


def hamming(record: Dict[str, str]) -> float:
    """Compute the hamming distance."""
    len1 = int(record["qlen"])
    len2 = int(record["slen"])
    try:
        ident = float(record["nident"])
    except KeyError:
        ident = float(record["length"]) * float(record["pident"]) / 100.0
    return max(len1, len2) - ident


metric_dict = {"hamming": hamming, "short_hamming": short_hamming}


def parse_line(line: str, fields: List[str]) -> Dict[str, str]:
    """Parse a line of BLAST+6 output.

    Parameters
    ----------
    line : str
    fields : List[str]

    Returns
    -------
    Dict[str, str]
        A mapping between the fields and their values.

    """
    records = line.split()
    return dict(zip(fields, records))


def parse_file(
    inputfile: TextIO, outputfile: TextIO, fields: str, distance_metric: str,
) -> None:
    r"""Parse blast+6 output and compute distances.

    Parameters
    ----------
    inputfile : TextIO
        The input stream.
        A blast file in format `-outfmt "6 <FIELDS>"`
    outputfile : TextIO
        The output stream.
        Will output in format "qacc\tsacc\tdistance\n"
    fields : str
        A string containing the space-separated list of fields
    distance_metric : str
        A function that computes a distance metric from the fields.

    Returns
    -------
    None

    """
    field_list = fields.split()
    metric = metric_dict[distance_metric]
    for line in inputfile:
        record = parse_line(line, field_list)
        id1 = record["qacc"]
        id2 = record["sacc"]
        distance = metric(record)
        outputfile.write(f"{id1}\t{id2}\t{distance}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Parse blast output and compute distances."
    )

    parser.add_argument(
        "-i",
        "--inputfile",
        type=str,
        required=True,
        help=r"Blast output generated with `-outfmt '6 <FIELDS>'`",
    )

    parser.add_argument(
        "-o",
        "--outputfile",
        type=str,
        required=True,
        help=r"Output in TSV format with fields qacc, tsacc, and distance",
    )

    parser.add_argument(
        "-f",
        "--fields",
        type=str,
        required=True,
        help=(
            "A string containing the space-separated list of fields "
            + "in the blast record."
        ),
    )

    parser.add_argument(
        "--distance_metric",
        choices=list(metric_dict.keys()),
        default="short_hamming",
        help="The distance metric to use. DEFAULT: short_hamming",
    )

    args = parser.parse_args()
    with open(args.inputfile, "r") as inputfile:
        with open(args.outputfile, "w") as outputfile:
            parse_file(inputfile, outputfile, args.fields, args.distance_metric)
