"""Make trees from distance matrices."""
import argparse
from typing import List, TextIO

from Bio.Phylo import write
from Bio.Phylo.BaseTree import Tree
from Bio.Phylo.TreeConstruction import DistanceMatrix, DistanceTreeConstructor


def build_distance_matrix(ids: List[str], distance_file: TextIO) -> DistanceMatrix:
    r"""Build a distance matrix.

    Parameters
    ----------
    ids : List[str]
        List of sequence IDs
    distance_file : TextIO
        File containing distances in f"{id1}\t{id12}\t{dist}\n" format.

    Returns
    -------
    DistanceMatrix

    """
    dm = DistanceMatrix(names=ids)
    for line in distance_file:
        id1, id2, distance = line.split()
        dm[id1, id2] = float(distance)
    return dm


def build_tree(dm: DistanceMatrix, method: str = "nj") -> Tree:
    """Build a tree from a distance matrix.

    Parameters
    ----------
    dm : DistanceMatrix
        The distance matrix.
    method : str
        One of "nj" (default) or "upgma"

    Returns
    -------
    Tree

    """
    if method == "nj":
        return DistanceTreeConstructor().nj(dm)
    elif method == "upgma":
        return DistanceTreeConstructor().upgma(dm)
    else:
        raise ValueError("method must be nj or upgma")


def distances_to_tree(
    id_filename: str,
    distance_filename: str,
    output_filename: str,
    method: str = "nj",
    fmt: str = "newick",
) -> None:
    r"""Read IDs and distances from files, build tree and write to a file.

    Parameters
    ----------
    id_filename : str
        File containing a list of sequence IDs, one per line.
    distance_filename : str
        File containing distances in f"{id1}\t{id12}\t{dist}\n" format.
    output_filename : str
        File to write output tree.
    method : str
        Tree-building method. One of "nj" (default) or "upgma"
    fmt : str
        Output format (default = "newick")

    Returns
    -------
    None

    """
    with open(id_filename, "r") as idfile:
        ids = idfile.read().split()
    with open(distance_filename, "r") as distfile:
        dm = build_distance_matrix(ids, distfile)
    tree = build_tree(dm, method)
    write(tree, output_filename, fmt)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Compute neighbor-joining tree from distances."
    )

    parser.add_argument(
        "--idfile",
        type=str,
        required=True,
        help="File containing a list of sequence IDs, one per line.",
    )

    parser.add_argument(
        "-d",
        "--distancefile",
        type=str,
        required=True,
        help="Pairwise distances in TSV format with fields qacc, tsacc, and distance",
    )

    parser.add_argument(
        "-o", "--outputfile", type=str, required=True, help=r"Output in newick format",
    )

    parser.add_argument(
        "--method",
        type=str,
        choices=["nj", "upgma"],
        default="nj",
        help="Method for building tree. Default: nj (neighbor-joining)",
    )

    args = parser.parse_args()
    distances_to_tree(
        args.idfile, args.distancefile, args.outputfile, method=args.method
    )
