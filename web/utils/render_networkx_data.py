"""utils/render_networkx_data.py

Initial version

"""

import os
import matplotlib.pyplot as plt
from networkx import nx
import networkx.readwrite.json_graph
import networkx.readwrite.json_graph.cytoscape as cytoscape
import json


def load_graph(ifilename=None):
    """Load graph from file

    """
    G = None
    # Testing mode

    if ifilename is None:
        n = 10  # 10 nodes
        m = 20  # 20 edges

        G = nx.gnm_random_graph(n, m)

        # some properties
        print("node degree clustering")
        for v in nx.nodes(G):
            print(f"{v} {nx.degree(G, v)} {nx.clustering(G, v)}")

        print()
        print("the adjacency list")
        for line in nx.generate_adjlist(G):
            print(line)
    else:
        pass


def render_json(G):
    """Render json to content/datasets/custom.json

    TODO: Make filename generic

    """
    # Export data
    n_json = cytoscape.cytoscape_data(G)
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    ofilename = '%s/../content/datasets/custom.json' % utils_dir

    with open(ofilename, 'w') as f:
        f.write(json.dumps(n_json))


def main():
    """Main entry

    """
    # TODO: Handle CLI params
    the_graph = load_graph()
    render_json(the_graph)


if __name__ == "__main__":
    main()

