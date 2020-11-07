'''web/flask_server.py
'''

from flask import Flask, request, send_from_directory
from flask import render_template

# set the project root directory as the static folder, you can set others.
app = Flask(__name__,
            static_url_path='', 
            static_folder='content',
            template_folder='content')
            #template_folder='content/templates')


@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('content/js', path)


# a route where we will display a welcome message via an HTML template
@app.route("/")
def hello():
    message = "Hello, World"
    return render_template('index.html')


if __name__ == "__main__":
    app.run(debug=True)


