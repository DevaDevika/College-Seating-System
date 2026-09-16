import { useState } from "react";
import "./App.css";
import Students from "./pages/Students";
import Classrooms from "./pages/Classrooms";
import Seating from "./pages/Seating";

function App() {
  const [page, setPage] = useState("dashboard");

  const [exam, setExam] = useState({
    name: "",
    subject: "",
    subjectCode: "",
    examCode: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [savedExam, setSavedExam] = useState(null);

  const handleChange = (e) => {
    setExam({
      ...exam,
      [e.target.name]: e.target.value,
    });
  };

 const saveExam = (e) => {
  e.preventDefault();

  setSavedExam({ ...exam });

  alert("Exam details saved successfully!");
};
  if (page === "exam") {
    return (
      <div className="dashboard">
        <button className="back-btn bottom-back" onClick={() => setPage("dashboard")}>
          ← Back to Dashboard
        </button>

        <h1>Exam Management</h1>
        <p>Create and manage examination details</p>

        <div className="form-card">
          <h2>Create Examination</h2>

          <form onSubmit={saveExam}>
            <label>Exam Name</label>
            <input
              name="name"
              placeholder="Example: Series Examination 1"
              value={exam.name}
              onChange={handleChange}
              required
            />

            <label>Subject</label>
            <input
              name="subject"
              placeholder="Example: Data Structures"
              value={exam.subject}
              onChange={handleChange}
              required
            />

            <label>Subject Code</label>
            <input
              name="subjectCode"
              placeholder="Example: CST301"
              value={exam.subjectCode}
              onChange={handleChange}
              required
            />

            <label>Exam Code</label>
            <input
              name="examCode"
              placeholder="Example: SER-2026-01"
              value={exam.examCode}
              onChange={handleChange}
              required
            />

            <label>Exam Date</label>
            <input
              type="date"
              name="date"
              value={exam.date}
              onChange={handleChange}
              required
            />

            <div className="time-row">
              <div>
                <label>Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={exam.startTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={exam.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button className="save-btn" type="submit">
              SAVE EXAM
            </button>
          </form>
          {savedExam && (
  <div className="form-card saved-exam-card">
    <h2>Saved Examination</h2>

    <div className="exam-table-wrapper">
      <table className="exam-table">
        <tbody>
          <tr>
            <th>Exam Name</th>
            <td>{savedExam.name}</td>
          </tr>

          <tr>
            <th>Subject</th>
            <td>{savedExam.subject}</td>
          </tr>

          <tr>
            <th>Subject Code</th>
            <td>{savedExam.subjectCode}</td>
          </tr>

          <tr>
            <th>Exam Code</th>
            <td>{savedExam.examCode}</td>
          </tr>

          <tr>
            <th>Exam Date</th>
            <td>{savedExam.date}</td>
          </tr>

          <tr>
            <th>Exam Time</th>
            <td>
              {savedExam.startTime} - {savedExam.endTime}
            </td>
          </tr>
        </tbody>
      </table>
      <button
  className="edit-btn"
  onClick={() => {
    setExam({ ...savedExam });
  }}
>
  EDIT EXAM
</button>
    </div>
  </div>
)}
        </div>
      </div>
    );
  }
if (page === "students") {
  return (
    <div className="dashboard">
      <Students />
      <button className="back-btn" onClick={() => setPage("dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );
}
if (page === "classrooms") {
  return (
    <div className="dashboard">
      <Classrooms />

      <button className="back-btn bottom-back" onClick={() => setPage("dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );
}
if (page === "seating") {
  return (
    <div className="dashboard">
      <Seating />

      <button
        className="back-btn bottom-back"
        onClick={() => setPage("dashboard")}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
 return (
  <div className="dashboard">

    <div className="dashboard-header">
      <div>
        <span className="portal-tag">TEACHER PORTAL</span>
        <h1>College Series Examination</h1>
        <p>Seating Arrangement Management System</p>
      </div>

      <div className="admin-badge">
        👤 Administrator
      </div>
    </div>

    <div className="welcome-box">
      <div>
        <h2>Welcome back, Administrator</h2>
        <p>Manage examinations, students, classrooms and seating arrangements.</p>
      </div>
      <div className="welcome-icon">🎓</div>
    </div>
<div className="dashboard-stats">
  <div className="stat-card">
    <span>EXAMINATIONS</span>
    <strong>02</strong>
  </div>

  <div className="stat-card">
    <span>STUDENTS</span>
    <strong>120</strong>
  </div>

  <div className="stat-card">
    <span>CLASSROOMS</span>
    <strong>04</strong>
  </div>

  <div className="stat-card">
    <span>SEATS</span>
    <strong>120</strong>
  </div>
</div>
    <h3 className="section-title">Management</h3>

    <div className="cards">

      <div className="card exam-card" onClick={() => setPage("exam")}>
        <div className="card-icon">📝</div>
        <h2>Examinations</h2>
        <p>Create and manage series examinations</p>
        <span>Open →</span>
      </div>

      <div className="card student-card" onClick={() => setPage("students")}>
        <div className="card-icon">👨‍🎓</div>
        <h2>Students</h2>
        <p>Add and manage student records</p>
        <span>Open →</span>
      </div>

      <div className="card classroom-card" onClick={() => setPage("classrooms")}>
        <div className="card-icon">🏫</div>
        <h2>Classrooms</h2>
        <p>Configure rooms and seating capacity</p>
        <span>Open →</span>
      </div>

      <div className="card seating-card" onClick={() => setPage("seating")}>
        <div className="card-icon">💺</div>
        <h2>Seating Arrangement</h2>
        <p>Generate and manage examination seating</p>
        <span>Open →</span>
      </div>

    </div>
  </div>
);
}

export default App;