import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function AddEngineer() {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleSkillsChange = (event) => {
    setSkills(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    axios
      .post("https://skillsets.lmasu.co.za/add_engineer", {
        name: name,
        skills: skills,
      })
      .then((response) => {
        console.log(response);
        alert(`Engineer ${name} was added successfully.`);
        setName("");
        setSkills("");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div className="add-engineer-container">
      <h2>Add Engineer</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" value={name} onChange={handleNameChange} />
        </div>
        <div className="form-control">
          <label htmlFor="skills">Skills:</label>
          <input type="text" id="skills" value={skills} onChange={handleSkillsChange} />
        </div>
        <button type="submit">Add Engineer</button>
      </form>
    </div>
  );
}

export default AddEngineer;