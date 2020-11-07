"""Computes a pairwise distance matrix from a BLAST alignment."""

import argparse
from typing import Callable, TextIO, Tuple


def short_hamming(ident: int, len1: int, len2: int) -> float:
    """Compute the normalized Hamming distance between two sequences."""
    return 1 - ident / min(len1, len2)


def parse_line(line: str, distance_metric: Callable) -> Tuple[str, str, float]:
    """Parse a line of BLAST+6 output.

    Parameters
    ----------
    line : str
        A blast line in format `-outfmt "6 qacc sacc length qlen slen ident"`
    distance_metric : Callable
        A function that computes a distance metric from the info in `line`.

    Returns
    -------
    query_accession : str
        The query sequence accession.
    subject_accession : str
        The subject sequence accession.
    distance : float
        The distance between the sequences.
    """
    qacc, sacc, length, qlen, slen, ident = line.split()
    return qacc, sacc, distance_metric(int(ident), int(qlen), int(slen))


def parse_file(
    inputfile: TextIO, outputfile: TextIO, distance_metric: Callable
) -> None:
    r"""Parse blast+6 output and compute distances.

    Parameters
    ----------
    inputfile : TextIO
        The input stream.
        A blast file in format `-outfmt "6 qacc sacc length qlen slen ident"`
    outputfile : TextIO
        The output stream.
        Will output in format "qacc\tsacc\tdistance\n"
    distance_metric : Callable
        A function that computes a distance metric from the info in `line`.

    Returns
    -------
    None

    """
    for line in inputfile:
        id1, id2, distance = parse_line(line, distance_metric)
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
        help=r"Blast output generated with `-outfmt '6 qacc sacc length qlen slen ident'`",
    )
    parser.add_argument(
        "-o",
        "--outputfile",
        type=str,
        required=True,
        help=r"Output in TSV format with fields qacc, tsacc, and distance",
    )
    parser.add_argument(
        "--distance_metric",
        choices=["short_hamming"],
        default="short_hamming",
        help="The distance metric to use. DEFAULT: short_hamming",
    )
    args = parser.parse_args()
    with open(args.inputfile, "r") as inputfile:
        with open(args.outputfile, "w") as outputfile:
            parse_file(inputfile, outputfile, short_hamming)
