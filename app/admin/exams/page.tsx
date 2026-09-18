"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Exam = {
  id: number;
  exam_date: string;
  subject: string;
  subject_code: string | null;
  exam_code: string | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
  updated_at: string;
};

type ExamForm = {
  exam_date: string;
  subject: string;
  subject_code: string;
  exam_code: string;
  start_time: string;
  end_time: string;
};

const emptyForm: ExamForm = {
  exam_date: "",
  subject: "",
  subject_code: "",
  exam_code: "",
  start_time: "",
  end_time: "",
};

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadExams() {
    try {
      setLoading(true);

      const response = await apiRequest("/api/exams");

      if (!response.success) {
        throw new Error(response.message || "Failed to load exams.");
      }

      setExams(response.exams || []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load exams."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  function updateField(
    field: keyof ExamForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (
      !form.exam_date ||
      !form.subject ||
      !form.start_time
    ) {
      setMessage(
        "Exam date, subject and start time are required."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await apiRequest("/api/exams", {
        method: "POST",
        body: JSON.stringify({
          exam_date: form.exam_date,
          subject: form.subject,
          subject_code: form.subject_code,
          exam_code: form.exam_code,
          start_time: form.start_time,
          end_time: form.end_time,
        }),
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to create exam."
        );
      }

      setMessage("Exam created successfully.");
      setForm(emptyForm);

      await loadExams();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create exam."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Exam Management
        </h1>

        <p style={{ color: "#475569" }}>
          Create and manage examination details before
          assigning students and seats.
        </p>
      </div>

      {message && (
        <div
          style={{
            marginBottom: "24px",
            padding: "14px 18px",
            borderRadius: "8px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
          }}
        >
          {message}
        </div>
      )}

      <section
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "28px",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "24px",
          }}
        >
          Add Exam
        </h2>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            <label>
              <span style={{ display: "block", marginBottom: "7px" }}>
                Exam date *
              </span>

              <input
                type="date"
                value={form.exam_date}
                onChange={(event) =>
                  updateField("exam_date", event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: "7px" }}>
                Subject *
              </span>

              <input
                type="text"
                placeholder="Example: Database Management"
                value={form.subject}
                onChange={(event) =>
                  updateField("subject", event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: "7px" }}>
                Subject code
              </span>

              <input
                type="text"
                placeholder="Example: CS301"
                value={form.subject_code}
                onChange={(event) =>
                  updateField("subject_code", event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: "7px" }}>
                Exam code
              </span>

              <input
                type="text"
                placeholder="Example: SE2026-01"
                value={form.exam_code}
                onChange={(event) =>
                  updateField("exam_code", event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: "7px" }}>
                Start time *
              </span>

              <input
                type="time"
                value={form.start_time}
                onChange={(event) =>
                  updateField("start_time", event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: "7px" }}>
                End time
              </span>

              <input
                type="time"
                value={form.end_time}
                onChange={(event) =>
                  updateField("end_time", event.target.value)
                }
                style={inputStyle}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "24px",
              padding: "11px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#0f172a",
              color: "white",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Creating..." : "Add Exam"}
          </button>
        </form>
      </section>

      <section
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div
          style={{
            padding: "22px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            Available Exams
          </h2>

          <span style={{ color: "#64748b" }}>
            {exams.length} exam{exams.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "30px", color: "#64748b" }}>
            Loading exams...
          </div>
        ) : exams.length === 0 ? (
          <div style={{ padding: "30px", color: "#64748b" }}>
            No exams have been created yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={cellHeader}>Date</th>
                  <th style={cellHeader}>Subject</th>
                  <th style={cellHeader}>Subject Code</th>
                  <th style={cellHeader}>Exam Code</th>
                  <th style={cellHeader}>Time</th>
                </tr>
              </thead>

              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td style={cell}>{exam.exam_date}</td>

                    <td style={{ ...cell, fontWeight: 600 }}>
                      {exam.subject}
                    </td>

                    <td style={cell}>
                      {exam.subject_code || "—"}
                    </td>

                    <td style={cell}>
                      {exam.exam_code || "—"}
                    </td>

                    <td style={cell}>
                      {exam.start_time}
                      {exam.end_time
                        ? ` – ${exam.end_time}`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "15px",
  background: "white",
};

const cellHeader: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 16px",
  fontSize: "14px",
  color: "#475569",
  borderBottom: "1px solid #e2e8f0",
};

const cell: React.CSSProperties = {
  padding: "15px 16px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "14px",
};