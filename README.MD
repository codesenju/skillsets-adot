

## Add an engineer with name "Bob" and skills "Python, SQL, Flask" using a POST request:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"name": "Bob", "skills": "Python, SQL, Flask"}' http://localhost:5000/add_engineer
```
## Retrieve the skills for an engineer with name "Bob" using a GET request:
```bash
curl http://localhost:5000/get_skills?name=Bob
```
## Retrieve the skills for all engineers using a GET request:
```bash
curl http://localhost:5000/get_all_engineers
```

## Other CRUD examples:
```bash
# Create an engineer with name "Alice" and skill set "Python, SQL, Flask":
curl -X POST -H "Content-Type: application/json" -d '{"skills": "Python, SQL, Flask"}' http://localhost:5000/create_engineer/Alice

# Read the skill set of an engineer named "Alice":
curl -X GET http://localhost:5000/get_engineer_skillset/Alice

# Update the skill set of an engineer named "Alice" to "Python, Flask, Django":
curl -X PUT -H "Content-Type: application/json" -d '{"skills": "Python, Flask, Django"}' http://localhost:5000/update_engineer_skillset/Alice

# Delete an engineer named "Alice":
curl -X DELETE http://localhost:5000/delete_engineer/Alice
```