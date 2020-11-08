from tempfile import NamedTemporaryFile

from preprocessing.buildtrees import distances_to_tree


def test_distances_to_tree():
    """Regression test for distances_to_tree."""
    id_fn = "example_data/2030446_ids.txt"
    dist_fn = "example_data/2030446_distances.tsv"
    out_fn = "example_data/2030446.tree"
    distances_to_tree(id_fn, dist_fn, out_fn)
    with open(out_fn, "r") as outputfile:
        target_output = outputfile.read()
    with NamedTemporaryFile("wt+") as tf:
        distances_to_tree(id_fn, dist_fn, tf.name)
        tf.seek(0)
        output = tf.read()
    assert output == target_output
