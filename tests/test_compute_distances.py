from tempfile import TemporaryFile

from preprocessing.computedistances import parse_file


def test_parse_file():
    """Regression test for parse_file."""
    fields = "qacc sacc length qlen slen nident"
    distance_metric = "short_hamming"
    with open("example_data/2030446_distances.tsv", "r") as outputfile:
        target_output = outputfile.read()
    with TemporaryFile("wt+") as tf:
        with open("example_data/2030446.tsv", "r") as inputfile:
            parse_file(inputfile, tf, fields, distance_metric)
            tf.seek(0)
            output = tf.read()
    assert output == target_output
