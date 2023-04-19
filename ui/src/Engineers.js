import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [engineers, setEngineers] = useState({});
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [skills, setSkills] = useState("");
  const [updatedSkills, setUpdatedSkills] = useState("");
  const [newEngineerName, setNewEngineerName] = useState("");
  const [newEngineerSkills, setNewEngineerSkills] = useState("");
  // const apiUrl = process.env.REACT_APP_API_URL;
  
  useEffect(() => {
    axios
      .get("/get_all_engineers")
      .then((response) => {
        console.log(response.data.user);
        setEngineers(response.data);
        setSelectedEngineer(Object.keys(response.data)[0]);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (selectedEngineer) {
      axios
        .get(`/get_skills?name=${selectedEngineer}`)
        .then((response) => {
          console.log(response.data);
          setSkills(response.data.skills);
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
      axios
        .delete(`/delete_engineer/${selectedEngineer}`)
        .then((response) => {
          console.log(response.data);
          const newEngineers = { ...engineers };
          delete newEngineers[selectedEngineer];
          setEngineers(newEngineers);
          setSelectedEngineer(Object.keys(newEngineers)[0]);
          alert(`${JSON.stringify(response.data)}`);
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
      axios
        .put(`/update_engineer_skillset/${selectedEngineer}`, { skills: updatedSkills })
        .then((response) => {
          console.log(response.data);
          setSkills(updatedSkills);
          setUpdatedSkills("");
          alert(`${JSON.stringify(response.data)}`);
        })
        .catch((error) => {
          alert(`An error occurred while updating the engineer: ${error.message}`);
        });
    }
  };


  const handleAddEngineer = () => {
    axios
      .post("/add_engineer", {
        name: newEngineerName,
        skills: newEngineerSkills,
      })
      .then((response) => {
        console.log(response.data);
        setNewEngineerName("");
        setNewEngineerSkills("");
        alert(`${JSON.stringify(response.data)}`);
        // Reload the page
        window.location.reload();
      })
      .catch((error) => {
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