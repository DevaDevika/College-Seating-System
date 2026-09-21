import { useEffect, useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "./App.css";
import Students from "./pages/Students";
import Classrooms from "./pages/Classrooms";
import Seating from "./pages/Seating";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const EXAMS_STORAGE_KEY = "college-seating-exams";

function App() {
  const [page, setPage] = useState("dashboard");
  const [studentCount, setStudentCount] = useState(0);
  const [classroomCount, setClassroomCount] = useState(0);
  const [seatCount, setSeatCount] = useState(0);

  const [exams, setExams] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(EXAMS_STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [exam, setExam] = useState({
    name: "",
    subject: "",
    subjectCode: "",
    examCode: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [editIndex, setEditIndex] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // Sync exams state to localStorage
  useEffect(() => {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    try {
      const savedStudents = JSON.parse(
        localStorage.getItem("college-seating-students") || "[]"
      );
      const savedRooms = JSON.parse(
        localStorage.getItem("college-seating-rooms") || "[]"
      );

      setStudentCount(Array.isArray(savedStudents) ? savedStudents.length : 0);
      setClassroomCount(Array.isArray(savedRooms) ? savedRooms.length : 0);
      setSeatCount(
        Array.isArray(savedRooms)
          ? savedRooms.reduce(
              (total, room) => total + Number(room.capacity || 0),
              0
            )
          : 0
      );
    } catch {
      setStudentCount(0);
      setClassroomCount(0);
      setSeatCount(0);
    }
  }, [page]);

  const stats = useMemo(
    () => [
      { label: "EXAMINATIONS", value: exams.length },
      { label: "STUDENTS", value: studentCount },
      { label: "CLASSROOMS", value: classroomCount },
      { label: "SEATS", value: seatCount },
    ],
    [exams.length, studentCount, classroomCount, seatCount]
  );

  const handleChange = (e) => {
    setExam({
      ...exam,
      [e.target.name]: e.target.value,
    });
  };

  const saveExam = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      const updatedExams = [...exams];
      updatedExams[editIndex] = { ...exam };
      setExams(updatedExams);
      setEditIndex(null);
      alert("Exam details updated successfully!");
    } else {
      setExams([...exams, { ...exam }]);
      alert("Exam created successfully!");
    }

    setExam({
      name: "",
      subject: "",
      subjectCode: "",
      examCode: "",
      date: "",
      startTime: "",
      endTime: "",
    });
  };

  const editExamHandler = (index) => {
    setExam(exams[index]);
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteExamHandler = (index) => {
    if (window.confirm("Are you sure you want to delete this examination?")) {
      setExams(exams.filter((_, i) => i !== index));
      if (editIndex === index) {
        setEditIndex(null);
        setExam({
          name: "",
          subject: "",
          subjectCode: "",
          examCode: "",
          date: "",
          startTime: "",
          endTime: "",
        });
      }
    }
  };

  const clearAllExams = () => {
    if (window.confirm("Are you sure you want to clear all examination records?")) {
      setExams([]);
    }
  };

  // PDF Upload & Parser for Exam Timetables
  const handleExamFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      setUploadStatus("Parsing Exam Timetable PDF...");
      try {
        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          fullText += pageText + "\n";
        }

        parseAndAddExamsFromText(fullText);
      } catch (err) {
        console.error(err);
        setUploadStatus("Failed to parse PDF timetable. Please check file layout.");
      }
    } else {
      setUploadStatus("Parsing file text...");
      const reader = new FileReader();
      reader.onload = (event) => {
        parseAndAddExamsFromText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Extract Subject Code, Dates, and Exam Names from Text/PDF
  const parseAndAddExamsFromText = (text) => {
    const lines = text.split("\n");
    const extractedExams = [];

    // Regex for Subject Codes (e.g. CST301, 4151, CHE101)
    const codeRegex = /([A-Z]{2,4}\d{3,4}|\d{4})/i;
    // Regex for Dates (YYYY-MM-DD or DD/MM/YYYY)
    const dateRegex = /(\d{4}-\d{2}-\d{2}|\d{2}[\/-]\d{2}[\/-]\d{4})/;

    lines.forEach((line) => {
      const codeMatch = line.match(codeRegex);
      if (codeMatch) {
        const subjectCode = codeMatch[0];
        const dateMatch = line.match(dateRegex);
        const dateStr = dateMatch ? dateMatch[0] : new Date().toISOString().split("T")[0];

        let subjectName = line
          .replace(subjectCode, "")
          .replace(dateStr, "")
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .trim();

        if (!subjectName || subjectName.length < 3) {
          subjectName = `Subject ${subjectCode}`;
        }

        extractedExams.push({
          name: "Series Examination 1",
          subject: subjectName,
          subjectCode: subjectCode,
          examCode: `EXAM-${subjectCode}`,
          date: dateStr,
          startTime: "09:30",
          endTime: "12:30",
        });
      }
    });

    if (extractedExams.length > 0) {
      setExams((prev) => [...prev, ...extractedExams]);
      setUploadStatus(`Successfully imported ${extractedExams.length} examinations!`);
    } else {
      setUploadStatus("No valid exam subjects or codes found in the uploaded file.");
    }
  };

  if (page === "exam") {
    return (
      <div className="dashboard">
        <button className="back-btn bottom-back" onClick={() => setPage("dashboard")}>
          ← Back to Dashboard
        </button>

        <h1>Exam Management</h1>
        <p>Create manually or bulk import examination timetables from PDF/CSV</p>

        {/* Bulk Exam Timetable Upload Box */}
        <div className="form-card" style={{ marginBottom: "20px", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <h2>📄 Bulk Import Exam Timetable (PDF / CSV)</h2>
          <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "12px" }}>
            Upload your examination timetable PDF or schedule file to automatically extract exams.
          </p>

          <input
            type="file"
            accept=".pdf,.csv,.txt"
            onChange={handleExamFileUpload}
            style={{ padding: "8px", border: "1px dashed #22c55e", borderRadius: "6px", width: "100%", background: "#fff" }}
          />

          {uploadStatus && (
            <p style={{ marginTop: "10px", fontWeight: "bold", color: uploadStatus.includes("Successfully") ? "#15803d" : "#b91c1c" }}>
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Manual Exam Form */}
        <div className="form-card">
          <h2>{editIndex !== null ? "Edit Examination" : "Create Single Examination"}</h2>

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
              {editIndex !== null ? "UPDATE EXAM" : "SAVE EXAM"}
            </button>
            {editIndex !== null && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setEditIndex(null);
                  setExam({
                    name: "",
                    subject: "",
                    subjectCode: "",
                    examCode: "",
                    date: "",
                    startTime: "",
                    endTime: "",
                  });
                }}
              >
                CANCEL EDIT
              </button>
            )}
          </form>
        </div>

        {/* Saved Examinations List */}
        {exams.length > 0 && (
          <div className="form-card saved-exam-card" style={{ marginTop: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Saved Examinations ({exams.length})</h2>
              <button className="delete-btn" onClick={clearAllExams}>
                Clear All Exams
              </button>
            </div>

            {exams.map((item, index) => (
              <div key={index} className="exam-table-wrapper" style={{ marginBottom: "25px" }}>
                <table className="exam-table">
                  <tbody>
                    <tr>
                      <th>Exam Name</th>
                      <td>{item.name}</td>
                    </tr>
                    <tr>
                      <th>Subject</th>
                      <td>{item.subject} ({item.subjectCode})</td>
                    </tr>
                    <tr>
                      <th>Exam Code</th>
                      <td>{item.examCode}</td>
                    </tr>
                    <tr>
                      <th>Exam Date</th>
                      <td>{item.date}</td>
                    </tr>
                    <tr>
                      <th>Exam Time</th>
                      <td>
                        {item.startTime} - {item.endTime}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="student-actions" style={{ marginTop: "12px" }}>
                  <button className="edit-btn" onClick={() => editExamHandler(index)}>
                    EDIT EXAM
                  </button>
                  <button className="delete-btn" onClick={() => deleteExamHandler(index)}>
                    DELETE EXAM
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
        <button className="back-btn bottom-back" onClick={() => setPage("dashboard")}>
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

        <div className="admin-badge">👤 Administrator</div>
      </div>

      <div className="welcome-box">
        <div>
          <h2>Welcome back, Administrator</h2>
          <p>Manage examinations, students, classrooms and seating arrangements.</p>
        </div>
        <div className="welcome-icon">🎓</div>
      </div>

      <div className="dashboard-stats">
        {stats.map((item) => (
          <div className="stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
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