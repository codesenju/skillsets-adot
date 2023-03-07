# I wrote this using ChatGPT
from flask import Flask, jsonify, request
from prometheus_flask_exporter import PrometheusMetrics

import redis, os

app = Flask(__name__)
metrics = PrometheusMetrics(app)
# static information as metric
metrics.info('app_info', 'Application info', version='1.0.0')

host=os.getenv("REDIS_HOST")
port=os.getenv("REDIS_PORT")
r = redis.Redis(host=host, port=port, db=0)

@app.route('/add_engineer', methods=['POST'])
def add_engineer():
    # Get the engineer data from the request body
    engineer_data = request.json
    
    # Validate the engineer data format
    if 'name' not in engineer_data or 'skills' not in engineer_data:
        return jsonify({'error': 'Invalid engineer data format'})
    
    # Check if the engineer name already exists in the database
    if r.exists(engineer_data['name']):
        # Return an error message if the name already exists
        return jsonify({'error': 'Engineer name already exists'})
    
    # Add the engineer to the Redis database
    r.set(engineer_data['name'], engineer_data['skills'])
    
    # Return a success message
    return jsonify({'message': 'Engineer added successfully'})

@app.route('/update_engineer_skillset/<engineer_name>', methods=['PUT'])
def update_engineer_skillset(engineer_name):
    # Get the new skill set from the request body
    new_skill_set = request.get_json().get('skills')
    
    # Check if the engineer name exists in the Redis database
    if not r.exists(engineer_name):
        return jsonify({'message': 'Engineer name not found'})
    
    # Update the skill set in the Redis database
    r.set(engineer_name, new_skill_set)
    
    # Return a success message
    return jsonify({'message': 'Skillset updated successfully'})


@app.route('/get_skills', methods=['GET'])
def get_skills():
    # Get the name of the engineer to retrieve skills for from the query string
    name = request.args.get('name')
    
    # Retrieve the engineer's skills from the Redis database
    skills = r.get(name)
    
    # Return the skills as a JSON response
    return jsonify({'skills': skills.decode()})

@app.route('/get_all_engineers', methods=['GET'])
def get_all_engineers():
    # Get all engineer names and skills from the Redis database
    engineer_data = {}
    for key in r.scan_iter():
        engineer_data[key.decode()] = r.get(key).decode()
    
    # Return the engineer data as a JSON response
    return jsonify(engineer_data)

## New line ## NOT JSON
@app.route('/get_all_engineers_new', methods=['GET'])
def get_all_engineers_new():
    # Get all engineer names and skills from the Redis database
    engineer_data = {}
    for key in r.scan_iter():
        engineer_data[key.decode()] = r.get(key).decode()
    
    # Format the engineer data as a string with each engineer on a new line
    formatted_engineer_data = '\n'.join([f'{k}: {v}' for k, v in engineer_data.items()])
    
    # Return the formatted engineer data as a string
    return formatted_engineer_data


@app.route('/delete_engineer/<engineer_name>', methods=['DELETE'])
def delete_engineer(engineer_name):
    # Check if the engineer exists in the Redis database
    if not r.exists(engineer_name):
        return f"Engineer with name '{engineer_name}' does not exist", 404

    # Delete the engineer from the Redis database
    r.delete(engineer_name)

    # Return a success message
    return f"Engineer with name '{engineer_name}' has been deleted", 200

if __name__ == '__main__':
    app.run(debug=True)
