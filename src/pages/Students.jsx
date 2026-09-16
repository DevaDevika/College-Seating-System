import { useState } from "react";

function Students() {
  const [students, setStudents] = useState([]);

  const [prn, setPrn] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [editIndex, setEditIndex] = useState(null);

 const addStudent = (e) => {
  e.preventDefault();

  const newStudent = {
    prn,
    name,
    department,
    year,
  };

  if (editIndex !== null) {
    const updatedStudents = [...students];
    updatedStudents[editIndex] = newStudent;
    setStudents(updatedStudents);
    setEditIndex(null);
  } else {
    setStudents([...students, newStudent]);
  }

  setPrn("");
  setName("");
  setDepartment("");
  setYear("");
};

  return (
    <div>
      <h1>Student Management</h1>
      <p>Add and manage students for examination seating.</p>
      
      <div className="student-summary">
       <div>
       <span>Total Students</span>
       <strong>{students.length}</strong>
      </div>
      </div>
      <div className="form-card">
        <h2>Add Student</h2>

        <form onSubmit={addStudent}>
          <label>PRN</label>
          <input
            type="text"
            placeholder="Enter PRN"
            value={prn}
            onChange={(e) => setPrn(e.target.value)}
            required
          />

          <label>Student Name</label>
          <input
            type="text"
            placeholder="Enter student name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          >
            <option value="">Select Department</option>
            <option>Computer Engineering</option>
            <option>Electronics Engineering</option>
            <option>Electrical Engineering</option>
            <option>Mechanical Engineering</option>
            <option>Civil Engineering</option>
            <option>Instrumentation Engineering</option>
          </select>

          <label>Class / Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          >
            <option value="">Select Class / Year</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
          </select>

          <button className="save-btn" type="submit">
            ADD STUDENT
          </button>
        </form>
      </div>

      {students.length > 0 && (
        <div className="form-card">
          <h2>Added Students</h2>

          {students.map((student, index) => (
            <div className="student-item" key={index}>
  <div>
    <strong>{student.name}</strong>
    <p>PRN: {student.prn}</p>
    <p>
      {student.department} • {student.year}
    </p>
  </div>

  <div className="student-actions">
  <button
    className="edit-btn"
    onClick={() => {
      setPrn(student.prn);
      setName(student.name);
      setDepartment(student.department);
      setYear(student.year);
      setEditIndex(index);
    }}
  >
    EDIT
  </button>

  <button
    className="delete-btn"
    onClick={() =>
      setStudents(students.filter((_, i) => i !== index))
    }
  >
    DELETE
  </button>
</div>
</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Students;