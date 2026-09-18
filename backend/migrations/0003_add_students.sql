ALTER TABLE students ADD COLUMN department TEXT;

ALTER TABLE students ADD COLUMN class_year TEXT;

CREATE INDEX IF NOT EXISTS idx_students_department
ON students(department);

CREATE INDEX IF NOT EXISTS idx_students_class_year
ON students(class_year);