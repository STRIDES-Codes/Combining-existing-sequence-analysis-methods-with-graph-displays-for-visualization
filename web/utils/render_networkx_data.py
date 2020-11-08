"""utils/render_networkx_data.py

Initial version

"""

import os
import json
import argparse
import matplotlib.pyplot as plt
import networkx
from networkx import nx
import networkx.readwrite.json_graph.cytoscape as cytoscape


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
        try:
            G = networkx.read_graphml(open(ifilename,'r'))
        except Exception as ifile_err:
            print(f"Unable to load graph from {ifilename}: {ifile_err}")
 
    return G


def render_json(G):
    """Render json to content/datasets/custom.json

    TODO: Make filename generic

    """
    # Export data
    n_json = cytoscape.cytoscape_data(G)
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    ofilename = '%s/../content/datasets/custom.json' % utils_dir

    # Export only the 'elements' list
    # {
    #     "data": [
    #       [
    #         "node_default",
    #         {}
    #       ],
    #       [
    #         "edge_default",
    #         {}
    #       ]
    #     ],
    #     "directed": false,
    #     "multigraph": false,
    #     "elements": {
    #       "nodes": [
    #         {
    #           "data": {
    #             "name": "MT704048.1",
    #             "community": 2,
    #             "id": "n0",
    #             "value": "n0"
    #           }
    #         },

    exported_cyto_json = n_json['elements']

    # Color the edges ({1.0, 7.0} community ids)
    nodes = n_json['elements']['nodes']
    edges = n_json['elements']['edges']
    community_membership = {}
    for node in nodes:
        community_membership[node['data']['id']] = node['data']['community']
        
    community_list = []
    for node in nodes:
        community_list.append(node['data']['community'])
    community_list = list(set(community_list))
    
    # import matplotlib.colors
#     colors = ["darkorange", "gold", "lawngreen", "lightseagreen"]
#     from matplotlib import cm
#     viridis = cm.get_cmap('viridis', len(community_list))
#     viridis
#     print(viridis)
#     print(viridis(1))
#     matplotlib.colors.rgb2hex(viridis(1)[:3])
#     history

    for edge in edges:
        edge_id = edge['data']['source']
        edge['data'].update(dict(community=community_membership[edge_id]))                

    n_json['edges']=edges

    with open(ofilename, 'w') as f:
        print(f"Writing cytoscape JSON data file to {ofilename}")
        f.write(json.dumps(exported_cyto_json))



def get_cli_options():
    """

    """
    # help flag provides flag help
    # store_true actions stores argument as True

    parser = argparse.ArgumentParser()
   
    parser.add_argument('-i', '--ifilename', type=str, required=True, 
        help="The filename of the graphml output from igraph.")

    args = parser.parse_args()

    return args



def main():
    """Main entry

    """
    # TODO: Handle CLI params
    cli_options = get_cli_options()
    ifilename =  cli_options.ifilename
    the_graph = load_graph(ifilename)
    render_json(the_graph)



if __name__ == "__main__":
    main()

