import { useState } from "react";

function Seating() {
  const [exam, setExam] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [room, setRoom] = useState("");
  const [generated, setGenerated] = useState(false);

  const generateSeating = (e) => {
    e.preventDefault();
    setGenerated(true);
  };

  return (
    <div>
      <h1>Seating Arrangement</h1>
      <p>Generate and manage examination seating arrangements.</p>

      <div className="form-card">
        <h2>Generate Seating</h2>

        <form onSubmit={generateSeating}>
          <label>Select Examination</label>
          <select
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            required
          >
            <option value="">Select Examination</option>
            <option>Series Examination 1</option>
            <option>Series Examination 2</option>
          </select>

          <label>Select Department</label>
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

          <label>Select Classroom</label>
<select
  value={room}
  onChange={(e) => setRoom(e.target.value)}
  required
>
  <option value="">Select Classroom</option>
  <option>Room 101</option>
  <option>Room 102</option>
  <option>Room 103</option>
  <option>Room 104</option>
</select>

          <label>Select Class / Year</label>
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
            GENERATE SEATING
          </button>
          <button
  type="button"
  className="clear-btn"
  onClick={() => {
    setExam("");
    setDepartment("");
    setRoom("");
    setYear("");
    setGenerated(false);
  }}
>
  CLEAR
</button>
        </form>
      </div>

      {generated && (
        <div className="form-card">
          <h2>Seating Arrangement Generated</h2>

          <p>
            Seating arrangement has been generated for the selected
            examination.
          </p>

          <div className="capacity-preview">
            <strong>{exam}</strong>
<br />
{room}
<br />
{department} • {year}
<br />
Capacity: <strong>30 Seats</strong>
          </div>

          <div className="seat-layout">
            <h3>Classroom Seat Layout</h3>
            <div className="seat-legend">
  <span>
    <span className="legend-box"></span>
    Assigned Seat
  </span>

  <span>
    <span className="legend-label">PRN + Name</span>
  </span>
</div>
            <div className="seat-row">
              <div className="bench">
                <span className="seat">
                  <strong>2026CE001</strong>
                  <small>Arjun</small>
                </span>

                <span className="seat">A2</span>
              </div>

              <div className="bench">
                <span className="seat">A3</span>
                <span className="seat">A4</span>
              </div>

              <div className="bench">
                <span className="seat">A5</span>
                <span className="seat">A6</span>
              </div>
            </div>

            <div className="seat-row">
              <div className="bench">
                <span className="seat">B1</span>
                <span className="seat">B2</span>
              </div>

              <div className="bench">
                <span className="seat">B3</span>
                <span className="seat">B4</span>
              </div>

              <div className="bench">
                <span className="seat">B5</span>
                <span className="seat">B6</span>
              </div>
            </div>
          </div>
        </div>
                )}
    </div>
  );
}

export default Seating;