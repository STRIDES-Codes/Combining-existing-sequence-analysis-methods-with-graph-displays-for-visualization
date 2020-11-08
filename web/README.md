web
===

Frameworks and tools
--------------------


    cytoscape.js: https://github.com/cytoscape/cytoscape.js
    cytoscape.js tutorial demo: https://github.com/cytoscape/cytoscape.js-tutorial-demo 
    networkx



HOWTO: Start the web app (flask)
--------------------------------


Run the following command to start the flask server


    python flask_server.py
    

Navigate your browser to this url


    http://localhost:5000/



HOWTO: Generate JSON data (sample) 
-----------------------------------

Sample JSON data is rendered (by default) in `content/datasets/custom.js`




    python utils/render_networkx_data.py -i content/datasets/seq_graph.graphml



