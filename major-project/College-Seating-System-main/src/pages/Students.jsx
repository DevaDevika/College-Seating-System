import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source for PDF.js parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const STORAGE_KEY = "college-seating-students";

function Students() {
  const [students, setStudents] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [prn, setPrn] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  // Handle Manual Add / Edit
  const addStudent = (e) => {
    e.preventDefault();

    const newStudent = {
      prn: prn.trim(),
      name: name.trim(),
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

    resetForm();
  };

  const startEdit = (index) => {
    const studentToEdit = students[index];
    setPrn(studentToEdit.prn);
    setName(studentToEdit.name);
    setDepartment(studentToEdit.department);
    setYear(studentToEdit.year);
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditIndex(null);
    resetForm();
  };

  const resetForm = () => {
    setPrn("");
    setName("");
    setDepartment("");
    setYear("");
  };

  const deleteStudent = (index) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      const updated = students.filter((_, i) => i !== index);
      setStudents(updated);
      if (editIndex === index) {
        cancelEdit();
      }
    }
  };

  const clearAllStudents = () => {
    if (window.confirm("Are you sure you want to delete all student records?")) {
      setStudents([]);
    }
  };

  // Handle PDF Upload and Parse
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      setUploadStatus("Parsing PDF file...");
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

        parseAndAddStudentsFromText(fullText);
      } catch (err) {
        console.error(err);
        setUploadStatus("Failed to parse PDF. Please check file format.");
      }
    } else {
      // CSV or plain text parsing
      setUploadStatus("Parsing text/CSV file...");
      const reader = new FileReader();
      reader.onload = (event) => {
        parseAndAddStudentsFromText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Flexible parser for student details from extracted text
  const parseAndAddStudentsFromText = (text) => {
    const lines = text.split("\n");
    const extractedList = [];

    // RegEx pattern to recognize common PRN / Register Numbers (e.g., 200101, CHE20CS001, etc.)
    const prnRegex = /([A-Z0-9]{6,12})/i;

    lines.forEach((line) => {
      const match = line.match(prnRegex);
      if (match) {
        const foundPrn = match[0];
        // Remove PRN and extract remaining text as student name
        let extractedName = line.replace(foundPrn, "").replace(/[^a-zA-Z\s]/g, "").trim();

        if (extractedName.length > 2) {
          extractedList.push({
            prn: foundPrn,
            name: extractedName,
            department: department || "Computer Engineering",
            year: year || "3rd Year",
          });
        }
      }
    });

    if (extractedList.length > 0) {
      setStudents((prev) => [...prev, ...extractedList]);
      setUploadStatus(`Successfully imported ${extractedList.length} students!`);
    } else {
      setUploadStatus("No valid student records found in the uploaded file.");
    }
  };

  return (
    <div>
      <h1>Student Management</h1>
      <p>Add and manage students manually or bulk upload via PDF/CSV.</p>

      <div className="student-summary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span>Total Students: <strong>{students.length}</strong></span>
        </div>
        {students.length > 0 && (
          <button className="delete-btn" onClick={clearAllStudents}>
            Clear All Students
          </button>
        )}
      </div>

      {/* Bulk PDF / Document Upload Card */}
      <div className="form-card" style={{ marginBottom: "20px", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
        <h2>📄 Bulk Import Students (PDF / CSV File)</h2>
        <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "12px" }}>
          Select a default Department and Class below, then upload your PDF/CSV list.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          <div>
            <label>Default Department for Import</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select Department</option>
              <option>Computer Engineering</option>
              <option>Electronics Engineering</option>
              <option>Electrical Engineering</option>
              <option>Mechanical Engineering</option>
              <option>Civil Engineering</option>
              <option>Instrumentation Engineering</option>
            </select>
          </div>

          <div>
            <label>Default Class / Year for Import</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Select Class / Year</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
            </select>
          </div>
        </div>

        <input
          type="file"
          accept=".pdf,.csv,.txt"
          onChange={handleFileUpload}
          style={{ padding: "8px", border: "1px dashed #22c55e", borderRadius: "6px", width: "100%", background: "#fff" }}
        />

        {uploadStatus && (
          <p style={{ marginTop: "10px", fontWeight: "bold", color: uploadStatus.includes("Successfully") ? "#15803d" : "#b91c1c" }}>
            {uploadStatus}
          </p>
        )}
      </div>

      {/* Manual Entry Form */}
      <div className="form-card">
        <h2>{editIndex !== null ? "Edit Student Record" : "Add Single Student"}</h2>

        <form onSubmit={addStudent}>
          <label>PRN (Register Number)</label>
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
          <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
            <option value="">Select Department</option>
            <option>Computer Engineering</option>
            <option>Electronics Engineering</option>
            <option>Electrical Engineering</option>
            <option>Mechanical Engineering</option>
            <option>Civil Engineering</option>
            <option>Instrumentation Engineering</option>
          </select>

          <label>Class / Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} required>
            <option value="">Select Class / Year</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
          </select>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <button className="save-btn" type="submit">
              {editIndex !== null ? "UPDATE STUDENT" : "ADD STUDENT"}
            </button>
            {editIndex !== null && (
              <button type="button" className="clear-btn" onClick={cancelEdit}>
                CANCEL
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Student List */}
      {students.length > 0 && (
        <div className="form-card" style={{ marginTop: "20px" }}>
          <h2>Added Students ({students.length})</h2>

          {students.map((student, index) => (
            <div
              className={`student-item ${editIndex === index ? "editing" : ""}`}
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                marginBottom: "10px",
                borderBottom: "1px solid #eee"
              }}
            >
              <div>
                <strong>{student.name}</strong>
                <p style={{ margin: "4px 0" }}>PRN: {student.prn}</p>
                <p style={{ margin: 0, color: "#666" }}>
                  {student.department} • {student.year}
                </p>
              </div>

              <div className="student-actions" style={{ display: "flex", gap: "8px" }}>
                <button className="edit-btn" onClick={() => startEdit(index)}>
                  EDIT
                </button>

                <button className="delete-btn" onClick={() => deleteStudent(index)}>
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