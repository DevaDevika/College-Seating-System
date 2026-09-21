import { useState, useEffect } from "react";

const EXAMS_STORAGE_KEY = "college-seating-exams";
const ROOMS_STORAGE_KEY = "college-seating-rooms";
const STUDENTS_STORAGE_KEY = "college-seating-students";

function Seating() {
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);

  // Form selections
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  // Arrangement settings
  const [shuffle, setShuffle] = useState(true);
  const [separateHorizontal, setSeparateHorizontal] = useState(true);
  const [separateVertical, setSeparateVertical] = useState(true);
  const [blockDiagonal, setBlockDiagonal] = useState(false);

  // Generated results
  const [generatedLayout, setGeneratedLayout] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Load dynamic data from localStorage
  useEffect(() => {
    try {
      const savedExams = JSON.parse(localStorage.getItem(EXAMS_STORAGE_KEY) || "[]");
      setExams(Array.isArray(savedExams) ? savedExams : []);

      const savedRooms = JSON.parse(localStorage.getItem(ROOMS_STORAGE_KEY) || "[]");
      setRooms(Array.isArray(savedRooms) ? savedRooms : []);

      const savedStudents = JSON.parse(localStorage.getItem(STUDENTS_STORAGE_KEY) || "[]");
      setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    } catch (err) {
      console.error("Error loading seating data:", err);
    }
  }, []);

  // Generate Seating Arrangement Algorithm
  const generateSeating = () => {
    if (students.length === 0) {
      setStatusMessage("❌ No students found in the system. Please add or upload students first.");
      setGeneratedLayout(null);
      return;
    }

    // Filter active/selected classrooms only
    const activeRooms = rooms.filter((r) => r.isActive !== false);

    if (activeRooms.length === 0) {
      setStatusMessage("❌ No active classrooms available. Please enable classrooms in Classroom Management.");
      setGeneratedLayout(null);
      return;
    }

    // Filter target classrooms based on room selection
    const targetRooms = selectedRoom === "All" 
      ? activeRooms 
      : activeRooms.filter((r) => r.roomNumber === selectedRoom);

    // Filter target students based on Year selection
    let targetStudents = selectedYear === "All"
      ? [...students]
      : students.filter((s) => s.year === selectedYear);

    if (targetStudents.length === 0) {
      setStatusMessage("❌ No students match the selected Class/Year filter.");
      setGeneratedLayout(null);
      return;
    }

    // Apply shuffling if enabled
    if (shuffle) {
      targetStudents = [...targetStudents].sort(() => Math.random() - 0.5);
    }

    let studentIndex = 0;
    const layoutResult = [];

    // Allocate students into room grids
    targetRooms.forEach((room) => {
      const rowCount = Number(room.rows) || 1;
      const benchCount = Number(room.benches) || 1;
      const seatCount = Number(room.seats) || 2;

      const roomGrid = [];

      for (let r = 0; r < rowCount; r++) {
        const rowData = [];
        for (let b = 0; b < benchCount; b++) {
          const benchSeats = [];
          for (let s = 0; s < seatCount; s++) {
            if (studentIndex < targetStudents.length) {
              benchSeats.push(targetStudents[studentIndex]);
              studentIndex++;
            } else {
              benchSeats.push(null); // Empty seat
            }
          }
          rowData.push(benchSeats);
        }
        roomGrid.push(rowData);
      }

      layoutResult.push({
        roomNumber: room.roomNumber,
        grid: roomGrid,
        capacity: room.capacity || rowCount * benchCount * seatCount,
      });
    });

    setGeneratedLayout(layoutResult);
    const unallocated = targetStudents.length - studentIndex;
    if (unallocated > 0) {
      setStatusMessage(`⚠️ Seating generated! Note: ${unallocated} student(s) could not fit into the selected classrooms.`);
    } else {
      setStatusMessage(`✅ Seating arrangement generated successfully for ${studentIndex} students!`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="seating-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>Generate Seating</h1>

      <div className="form-card">
        {/* Select Examination */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
            Select Examination
          </label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          >
            <option value="">Select Examination</option>
            {exams.length > 0 ? (
              exams.map((item, idx) => (
                <option key={idx} value={item.examCode || item.name}>
                  {item.name} ({item.subjectCode || item.subject})
                </option>
              ))
            ) : (
              <option disabled>No saved examinations found</option>
            )}
          </select>
        </div>

        {/* Select Classroom */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
            Select Classroom
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          >
            <option value="All">All Configured Classrooms</option>
            {rooms.filter((r) => r.isActive !== false).map((room, idx) => (
              <option key={idx} value={room.roomNumber}>
                Room {room.roomNumber} (Capacity: {room.capacity})
              </option>
            ))}
          </select>
        </div>

        {/* Select Class / Year */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
            Select Class / Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          >
            <option value="All">All Classes</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
          </select>
        </div>

        {/* Arrangement Settings */}
        <div style={{ marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
          <h3 style={{ textAlign: "center", fontSize: "1.1rem", marginBottom: "15px" }}>
            Arrangement Settings
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <label style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Shuffle student order
            </label>

            <label style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={separateHorizontal}
                onChange={(e) => setSeparateHorizontal(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Separate same-department neighbors
            </label>

            <label style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={separateVertical}
                onChange={(e) => setSeparateVertical(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Separate same-department vertical seats
            </label>

            <label style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={blockDiagonal}
                onChange={(e) => setBlockDiagonal(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Block diagonal same-department seating
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: "25px", textAlign: "center" }}>
          <button
            onClick={generateSeating}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "12px 24px",
              fontSize: "1rem",
              fontWeight: "bold",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            GENERATE SEATING ARRANGEMENT
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          style={{
            margin: "20px 0",
            padding: "12px",
            borderRadius: "6px",
            textAlign: "center",
            fontWeight: "bold",
            backgroundColor: statusMessage.includes("❌") ? "#fef2f2" : "#f0fdf4",
            color: statusMessage.includes("❌") ? "#991b1b" : "#166534",
            border: statusMessage.includes("❌") ? "1px solid #fecaca" : "1px solid #bbf7d0",
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Seating Layout Display */}
      {generatedLayout && (
        <div style={{ marginTop: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2>Seating Arrangement Plan</h2>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: "#059669",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🖨️ Print / Save PDF
            </button>
          </div>

          {generatedLayout.map((roomData, roomIdx) => (
            <div
              key={roomIdx}
              className="form-card"
              style={{ marginBottom: "25px", backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
            >
              <h3 style={{ borderBottom: "2px solid #2563eb", paddingBottom: "8px" }}>
                Classroom: {roomData.roomNumber}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
                {roomData.grid.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      display: "flex",
                      justifyContent: "space-around",
                      background: "#f8fafc",
                      padding: "8px",
                      borderRadius: "6px",
                    }}
                  >
                    <span style={{ fontWeight: "bold", color: "#64748b" }}>Row {rIdx + 1}</span>
                    <div style={{ display: "flex", gap: "15px" }}>
                      {row.map((bench, bIdx) => (
                        <div
                          key={bIdx}
                          style={{
                            border: "1px solid #cbd5e1",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            background: "#fff",
                            fontSize: "0.85rem",
                          }}
                        >
                          <strong>Bench {bIdx + 1}:</strong>
                          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            {bench.map((seat, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: seat ? "#e0f2fe" : "#f1f5f9",
                                  color: seat ? "#0369a1" : "#94a3b8",
                                  fontWeight: seat ? "600" : "normal",
                                }}
                              >
                                {seat ? `${seat.name} (${seat.prn})` : "EMPTY"}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Seating;