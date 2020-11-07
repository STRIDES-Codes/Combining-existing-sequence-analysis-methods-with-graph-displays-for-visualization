# -*- coding: utf-8 -*-
"""Filter a list of sequences and write the passing ones to a fasta file.

Created on Fri Nov  6 17:16:31 2020

@author: connorrp
"""
import re
import subprocess

from Bio import SeqIO


def available_seqs(base_dir):
    """Return a sequence of all files in a directory."""
    fname_list = subprocess.getoutput("ls " + base_dir)
    for x in fname_list.split("\n"):
        yield x


def load_seq(base_dir: str, fname: str, frmt: str = "fasta") -> SeqIO.SeqRecord:
    """Load a sequence from file.

    Parameters
    ----------
    base_dir : str
        Directory of the source sequence
    fname : str
        Filename within base_dir
    frmt : str
        Format of the sequence. Default: fasta

    Returns
    -------
    SeqIO.SeqRecord

    """
    return SeqIO.read(base_dir + fname, frmt)


def filter_seqs(
    seq: SeqIO.SeqRecord,
    min_len: int,
    max_len: int,
    max_nambig: int,
    max_ambig_run: int,
    max_pambig: float,
) -> bool:
    """Return True if fails any of the filters and False otherwise.

    Parameters
    ----------
    seq : SeqIO.SeqRecord
        seq
    min_len : int
        min_len
    max_len : int
        max_len
    max_nambig : int
        max_nambig
    max_ambig_run : int
        max_ambig_run
    max_pambig : float
        max_pambig

    Returns
    -------
    bool

    """
    slen = len(seq.seq)
    ambig_codes = "[YRWSKMDVHBXN]"
    max_ambig = "".join([ambig_codes, "{", str(max_ambig_run + 1), "}"])

    if min_len <= slen <= max_len:
        ambig_count = len(re.findall(ambig_codes, str(seq.seq)))
        pambig = 100 * ambig_count / slen
        if (ambig_count <= max_nambig) & (pambig <= max_pambig):
            if len(re.findall(max_ambig, str(seq.seq))) == 0:
                return False
    return True


def get_seqs(
    base_dir: str,
    min_len: int,
    max_len: int,
    max_nambig: int,
    max_ambig_run: int,
    max_pambig: float,
) -> None:
    """Filter a list of sequences and write the passing ones to a fasta file.

    Parameters
    ----------
    base_dir : str
        The directory containing the candidate sequence files.
    min_len : int
        min_len
    max_len : int
        max_len
    max_nambig : int
        max_nambig
    max_ambig_run : int
        max_ambig_run
    max_pambig : float
        max_pambig

    Returns
    -------
    None

    """
    good_id_list = []
    good_seqs = []
    fnames = available_seqs(base_dir)
    for i, fname in enumerate(fnames):
        # why is this necessary, need to investigate, but fine for testing for now
        if i > 200:
            seq = load_seq(base_dir, fname)
            if not filter_seqs(
                seq, min_len, max_len, max_nambig, max_ambig_run, max_pambig
            ):
                good_id_list.append(".".join(fname.split(".")[:2]))
                good_seqs.append(seq)

    with open("good_ids.txt", "w") as f:
        f.write("\n".join(good_id_list))
    SeqIO.write(good_seqs, "good_seqs.fasta", "fasta")


if __name__ == "__main__":

    from sys import argv

    base_dir = argv[1]
    min_len = int(argv[2])
    max_len = int(argv[3])
    max_nambig = int(argv[4])
    max_ambig_run = int(argv[5])
    max_pambig = float(argv[6])

    get_seqs(base_dir, min_len, max_len, max_nambig, max_ambig_run, max_pambig)
