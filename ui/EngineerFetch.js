import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [engineers, setEngineers] = useState({});
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [skills, setSkills] = useState("");
  const [updatedSkills, setUpdatedSkills] = useState("");
  const [newEngineerName, setNewEngineerName] = useState("");
  const [newEngineerSkills, setNewEngineerSkills] = useState("");
//  const apiUrl = process.env.REACT_APP_API_URL;
  
  useEffect(() => {
    fetch(`/get_all_engineers`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setEngineers(data);
        setSelectedEngineer(Object.keys(data)[0]);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);


useEffect(() => {
    if (selectedEngineer) {
      console.log(selectedEngineer);
      fetch(`/get_skills?name=${selectedEngineer}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setSkills(data.skills);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [selectedEngineer]);

  const handleEngineerSelect = (e) => {
    setSelectedEngineer(e.target.value);
  };

  const handleDelete = () => {
    if (selectedEngineer) {
      fetch(`/delete_engineer/${selectedEngineer}`, { method: "DELETE" })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          const newEngineers = { ...engineers };
          delete newEngineers[selectedEngineer];
          setEngineers(newEngineers);
          setSelectedEngineer(Object.keys(newEngineers)[0]);
          alert(`${JSON.stringify(data)}`);
          //alert(`Engineer ${selectedEngineer} was deleted successfully.`);
        })
        .catch((error) => {
          console.log(error);
          alert(`An error occurred while deleting the engineer: ${error.message}`);
        });
    }
  };

  const handleUpdate = () => {
    if (selectedEngineer && updatedSkills) {
      fetch(`/update_engineer_skillset/${selectedEngineer}`, {
        method: "PUT",
        body: JSON.stringify({ skills: updatedSkills }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setSkills(updatedSkills);
          setUpdatedSkills("");
          alert(`${JSON.stringify(data)}`);
        })
        .catch((error) => {
          alert(`An error occurred while updating the engineer: ${error.message}`);
        });
    }
  };

  const handleAddEngineer = () => {
    fetch(`/add_engineer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newEngineerName,
        skills: newEngineerSkills,
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setNewEngineerName("");
        setNewEngineerSkills("");
        alert(`${JSON.stringify(data)}`);
        // Reload the page
        window.location.reload();
      })
      .catch(error => {
        console.log(error);
        alert(`An error occurred while adding the engineer: ${error.message}`);
      });
  };
  

  return (
    <div className="container">
      <div className="engineer-container">
        <h2>Engineers</h2>
        <select value={selectedEngineer} onChange={handleEngineerSelect}>
          {Object.keys(engineers).map((engineer) => (
            <option key={engineer} value={engineer}>
              {engineer}
            </option>
          ))}
        </select>
        <p>Skills: {skills}</p>
        <button onClick={handleDelete}>Delete Engineer</button>
      </div>

      <div className="update-container">
        <h2>Update Skills</h2>
        <div class="input-container">
        <label htmlFor="update-skills">New Skills:</label>
        <textarea
          type="text"
          id="update-skills"
          value={updatedSkills}
          onChange={(e) => setUpdatedSkills(e.target.value)}
        />
        </div>
        <button onClick={handleUpdate}>Update Skills</button>
      </div>

      <div class="add-engineer-container">
        <h2>Add Engineer</h2>
        <div class="input-container">
          <label for="engineer-name">Name:</label>
          <input type="text" id="engineer-name" value={newEngineerName} onChange={(e) => setNewEngineerName(e.target.value)} />
        </div>
        <div class="input-container">
          <label for="engineer-skills">Skills:</label>
          <textarea id="engineer-skills" value={newEngineerSkills} onChange={(e) => setNewEngineerSkills(e.target.value)}></textarea>
        </div>
        <button onClick={handleAddEngineer}>Add Engineer</button>
      </div>


    </div>
  );
}

export default App;