import test from "node:test";
import assert from "node:assert/strict";

import { generateSeatingPlan } from "./seatingEngine.js";

test("allocates students across rooms without same-class neighbors when possible", () => {
  const students = [
    { prn: "S1", name: "A", department: "CSE-A" },
    { prn: "S2", name: "B", department: "CSE-A" },
    { prn: "S3", name: "C", department: "ECE-B" },
    { prn: "S4", name: "D", department: "ECE-B" },
    { prn: "S5", name: "E", department: "ME-A" },
    { prn: "S6", name: "F", department: "ME-A" },
  ];

  const rooms = [
    { roomNumber: "Room 101", capacity: 3 },
    { roomNumber: "Room 102", capacity: 3 },
  ];

  const result = generateSeatingPlan({
    students,
    rooms,
    options: {
      shuffle: false,
      requireDifferentAdjacent: true,
      requireDifferentVertical: true,
      diagonalRestriction: false,
    },
  });

  assert.equal(result.assignments.length, 6);
  assert.ok(result.warnings.length === 0 || result.warnings.length <= 1);

  const seatGroups = result.assignments.map((seat) => seat.student?.department);
  const hasConflict = seatGroups.some((department, index) => {
    if (index === 0) return false;
    return department === seatGroups[index - 1];
  });

  assert.equal(hasConflict, false);
});

test("supports the user-facing shuffle arrangement setting", () => {
  const students = [
    { prn: "S1", name: "A", department: "CSE-A" },
    { prn: "S2", name: "B", department: "CSE-A" },
    { prn: "S3", name: "C", department: "ECE-B" },
    { prn: "S4", name: "D", department: "ECE-B" },
    { prn: "S5", name: "E", department: "ME-A" },
    { prn: "S6", name: "F", department: "ME-A" },
    { prn: "S7", name: "G", department: "CIVIL-A" },
    { prn: "S8", name: "H", department: "CIVIL-A" },
    { prn: "S9", name: "I", department: "EEE-A" },
    { prn: "S10", name: "J", department: "EEE-A" },
  ];

  const rooms = [{ roomNumber: "Room 101", rows: 2, benches: 2, seats: 2, capacity: 8 }];

  const result = generateSeatingPlan({
    students,
    rooms,
    options: {
      shuffleStudents: false,
      shuffle: false,
      requireDifferentAdjacent: true,
      requireDifferentVertical: true,
      diagonalRestriction: false,
    },
  });

  assert.deepEqual(
    result.assignments.map((assignment) => assignment.student.prn),
    ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
  );
});

test("reports a warning when constraints cannot be met in a fixed-capacity room", () => {
  const students = [
    ...Array.from({ length: 80 }, (_, index) => ({
      prn: `CSE-${index + 1}`,
      name: `CSE-${index + 1}`,
      department: "CSE-A",
    })),
    ...Array.from({ length: 20 }, (_, index) => ({
      prn: `ECE-${index + 1}`,
      name: `ECE-${index + 1}`,
      department: "ECE-B",
    })),
  ];

  const rooms = [{ roomNumber: "Room 101", capacity: 100 }];

  const result = generateSeatingPlan({
    students,
    rooms,
    options: {
      shuffle: false,
      requireDifferentAdjacent: true,
      requireDifferentVertical: true,
      diagonalRestriction: false,
    },
  });

  assert.ok(
    result.warnings.some((warning) => warning.includes("Rule A") || warning.includes("Some seating restrictions")),
    "Expected a warning for impossible seating restrictions.",
  );
});
