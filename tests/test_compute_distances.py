from tempfile import TemporaryFile

from preprocessing.computedistances import parse_file, short_hamming


def test_parse_file():
    """Regression test for parse_file."""
    with open("example_data/2030446_distances.tsv", "r") as outputfile:
        target_output = outputfile.read()
    with TemporaryFile("wt+") as tf:
        with open("example_data/2030446.tsv", "r") as inputfile:
            parse_file(inputfile, tf, short_hamming)
            tf.seek(0)
            output = tf.read()
    assert output == target_output
