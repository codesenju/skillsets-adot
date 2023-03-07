

## Add an engineer with name "Bob" and skills "Python, SQL, Flask" using a POST request:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"name": "Alice", "skills": "Python, SQL, Flask"}' http://localhost:5000/add_engineer
```
## Retrieve the skills for an engineer with name "Bob" using a GET request:
```bash
curl "http://localhost:5000/get_skills?name=Alice"
```
## Retrieve the skills for all engineers using a GET request:
```bash
curl http://localhost:5000/get_all_engineers
```
## Update
```bash
curl -X PUT -H "Content-Type: application/json" -d '{"skills": "Python, Flask, Django"}' http://localhost:5000/update_engineer_skillset/Alice
```
## Delete
```bash
curl -X DELETE http://localhost:5000/delete_engineer/Alice
```