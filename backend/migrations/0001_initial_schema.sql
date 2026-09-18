-- ============================================================
-- COLLEGE SERIES EXAMINATION SEATING ARRANGEMENT SYSTEM
-- Initial Database Schema
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. ADMINS
-- Only authenticated administrators can access the system.
-- Passwords must NEVER be stored as plain text.
-- ============================================================

CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. EXAMS
-- Stores examination information entered/edited by the admin.
-- ============================================================

CREATE TABLE exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    exam_date TEXT NOT NULL,
    subject TEXT NOT NULL,
    subject_code TEXT,
    exam_code TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. STUDENTS
-- A student belongs to an exam and has a PRN.
-- class_name stores department/class/year information.
-- Example: "CSE S4", "ECE S6", "ME S4"
-- ============================================================

CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    exam_id INTEGER NOT NULL,

    prn TEXT NOT NULL,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    UNIQUE (exam_id, prn)
);

-- ============================================================
-- 4. CLASSROOMS
-- Stores available examination rooms.
--
-- Example:
-- Room 101
-- 8 rows
-- 5 columns
-- = 40 seats
-- ============================================================

CREATE TABLE classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_number TEXT NOT NULL UNIQUE,

    rows INTEGER NOT NULL CHECK (rows > 0),
    columns INTEGER NOT NULL CHECK (columns > 0),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. SEATING ALLOCATIONS
--
-- Stores the final position of every student.
--
-- row_number and column_number identify the student's seat.
--
-- A student can have only one allocation for an exam.
--
-- A physical seat can have only one student in an exam.
-- ============================================================

CREATE TABLE seating_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    classroom_id INTEGER NOT NULL,

    row_number INTEGER NOT NULL CHECK (row_number > 0),
    column_number INTEGER NOT NULL CHECK (column_number > 0),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE CASCADE,

    UNIQUE (exam_id, student_id),

    UNIQUE (
        exam_id,
        classroom_id,
        row_number,
        column_number
    )
);

-- ============================================================
-- INDEXES
-- Improve lookup speed for common operations.
-- ============================================================

CREATE INDEX idx_students_exam
    ON students(exam_id);

CREATE INDEX idx_students_prn
    ON students(prn);

CREATE INDEX idx_allocations_exam
    ON seating_allocations(exam_id);

CREATE INDEX idx_allocations_student
    ON seating_allocations(student_id);

CREATE INDEX idx_allocations_classroom
    ON seating_allocations(classroom_id);