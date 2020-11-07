'''utils/render_networkx_data.py

'''
import os
import matplotlib.pyplot as plt
from networkx import nx
import networkx.readwrite.json_graph
import networkx.readwrite.json_graph.cytoscape as cytoscape
import json

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

# Export data
n_json = cytoscape.cytoscape_data(G)
utils_dir = os.path.dirname(os.path.abspath(__file__))
utils_dir = os.path.dirname(os.path.abspath(__file__))

with open('%s/../content/datasets/custom.json' % utils_dir,'w') as f:
    f.write(json.dumps(n_json))

