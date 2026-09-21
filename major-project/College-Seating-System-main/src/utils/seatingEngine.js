function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function getRoomDimensions(room) {
  const capacity = Number(room.capacity || 0);
  const rows = Number(room.rows || 0) || Math.ceil(Math.sqrt(Math.max(capacity, 1)));
  const benches = Number(room.benches || 0) || Math.max(1, Math.ceil(Math.max(capacity, 1) / rows));
  const seatsPerBench = Number(room.seats || 0) || 1;

  return {
    rows,
    benches,
    seatsPerBench,
    capacity: capacity || rows * benches * seatsPerBench,
  };
}

function buildSeatSlots(rooms) {
  const seatSlots = [];

  rooms.forEach((room) => {
    const { rows, benches, seatsPerBench, capacity } = getRoomDimensions(room);
    let created = 0;

    for (let row = 0; row < rows; row += 1) {
      for (let bench = 0; bench < benches; bench += 1) {
        for (let seat = 0; seat < seatsPerBench; seat += 1) {
          if (created >= capacity) {
            return;
          }

          seatSlots.push({
            roomNumber: room.roomNumber,
            roomIndex: seatSlots.length,
            row,
            bench,
            seatNumber: seat + 1,
          });

          created += 1;
        }
      }
    }
  });

  return seatSlots;
}

function isSameDepartment(a, b) {
  return a && b && a.student && b.student && a.student.department === b.student.department;
}

function isAdjacent(seatA, seatB) {
  return (
    seatA.roomNumber === seatB.roomNumber &&
    seatA.row === seatB.row &&
    Math.abs(seatA.bench - seatB.bench) === 1
  ) || (
    seatA.roomNumber === seatB.roomNumber &&
    seatA.bench === seatB.bench &&
    Math.abs(seatA.row - seatB.row) === 1
  ) || (
    seatA.roomNumber === seatB.roomNumber &&
    Math.abs(seatA.row - seatB.row) === 1 &&
    Math.abs(seatA.bench - seatB.bench) === 1
  );
}

function isVertical(seatA, seatB) {
  return (
    seatA.roomNumber === seatB.roomNumber &&
    seatA.bench === seatB.bench &&
    Math.abs(seatA.row - seatB.row) === 1
  );
}

function isDiagonal(seatA, seatB) {
  return (
    seatA.roomNumber === seatB.roomNumber &&
    Math.abs(seatA.row - seatB.row) === 1 &&
    Math.abs(seatA.bench - seatB.bench) === 1
  );
}

function evaluateSeatConflict(seat, department, assignments, rules) {
  let conflicts = 0;

  assignments.forEach((assignedSeat) => {
    if (assignedSeat.roomNumber !== seat.roomNumber) {
      return;
    }

    if (rules.requireDifferentAdjacent && isAdjacent(seat, assignedSeat) && assignedSeat.student.department === department) {
      conflicts += 1;
    }

    if (rules.requireDifferentVertical && isVertical(seat, assignedSeat) && assignedSeat.student.department === department) {
      conflicts += 1;
    }

    if (rules.diagonalRestriction && isDiagonal(seat, assignedSeat) && assignedSeat.student.department === department) {
      conflicts += 1;
    }
  });

  return conflicts;
}

export function generateSeatingPlan({ students = [], rooms = [], options = {} } = {}) {
  const rules = {
    shuffle: true,
    shuffleStudents: true,
    requireDifferentAdjacent: true,
    requireDifferentVertical: true,
    diagonalRestriction: false,
    sameDepartmentAdjacent: true,
    sameDepartmentVertical: true,
    diagonalSeats: false,
    ...options,
  };

  const effectiveRules = {
    ...rules,
    shuffle: Boolean(options.shuffle ?? options.shuffleStudents ?? rules.shuffle),
    requireDifferentAdjacent: Boolean(options.requireDifferentAdjacent ?? options.sameDepartmentAdjacent ?? rules.requireDifferentAdjacent),
    requireDifferentVertical: Boolean(options.requireDifferentVertical ?? options.sameDepartmentVertical ?? rules.requireDifferentVertical),
    diagonalRestriction: Boolean(options.diagonalRestriction ?? options.diagonalSeats ?? rules.diagonalRestriction),
  };

  const finalRules = effectiveRules;

  const normalizedRooms = rooms
    .filter((room) => room && (Number(room.capacity) > 0 || Number(room.rows) > 0 || Number(room.benches) > 0 || Number(room.seats) > 0))
    .map((room) => ({
      ...room,
      roomNumber: room.roomNumber || `Room ${room.id || "New"}`,
      capacity: Number(room.capacity || 0) || Number(room.rows || 0) * Number(room.benches || 0) * Number(room.seats || 0),
    }));

  const warnings = [];

  if (!students.length) {
    return { assignments: [], warnings: ["No students were provided for seating."], seatsByRoom: {} };
  }

  if (!normalizedRooms.length) {
    return { assignments: [], warnings: ["No classrooms are available for allocation."], seatsByRoom: {} };
  }

  const totalRoomCapacity = normalizedRooms.reduce((sum, room) => sum + Number(room.capacity || 0), 0);

  if (students.length > totalRoomCapacity) {
    warnings.push(`Only ${totalRoomCapacity} seats are available for ${students.length} students.`);
  }

  const shuffledStudents = finalRules.shuffle ? shuffle(students) : [...students];
  const seatSlots = buildSeatSlots(normalizedRooms);
  const assignments = [];
  const remainingStudents = [...shuffledStudents];

  seatSlots.forEach((seat) => {
    if (!remainingStudents.length) {
      return;
    }

    let bestChoice = null;
    let bestScore = Number.POSITIVE_INFINITY;

    remainingStudents.forEach((student, index) => {
      const conflictScore = evaluateSeatConflict(seat, student.department, assignments, finalRules);
      if (conflictScore < bestScore) {
        bestScore = conflictScore;
        bestChoice = { student, index };
      }
    });

    if (!bestChoice) {
      return;
    }

    const chosenStudent = remainingStudents.splice(bestChoice.index, 1)[0];
    assignments.push({
      ...seat,
      student: chosenStudent,
    });
  });

  const violatedRules = new Set();

  assignments.forEach((seat) => {
    assignments.forEach((otherSeat) => {
      if (seat === otherSeat || !seat.student || !otherSeat.student) {
        return;
      }

      if (seat.roomNumber !== otherSeat.roomNumber) {
        return;
      }

      if (finalRules.requireDifferentAdjacent && isAdjacent(seat, otherSeat) && seat.student.department === otherSeat.student.department) {
        violatedRules.add("Rule A");
      }

      if (finalRules.requireDifferentVertical && isVertical(seat, otherSeat) && seat.student.department === otherSeat.student.department) {
        violatedRules.add("Rule B");
      }

      if (finalRules.diagonalRestriction && isDiagonal(seat, otherSeat) && seat.student.department === otherSeat.student.department) {
        violatedRules.add("Rule C");
      }
    });
  });

  if (violatedRules.size > 0) {
    warnings.push(
      `Some seating restrictions could not be completely satisfied. Violated: ${[...violatedRules].join(", ")}.`,
    );
  }

  const sortedAssignments = [...assignments].sort((a, b) => {
    const roomCompare = a.roomNumber.localeCompare(b.roomNumber);
    if (roomCompare !== 0) {
      return roomCompare;
    }

    if (a.row !== b.row) {
      return a.row - b.row;
    }

    if (a.bench !== b.bench) {
      return a.bench - b.bench;
    }

    return a.seatNumber - b.seatNumber;
  });

  const seatsByRoom = {};
  sortedAssignments.forEach((entry) => {
    const roomAssignments = seatsByRoom[entry.roomNumber] || [];
    roomAssignments.push(entry);
    seatsByRoom[entry.roomNumber] = roomAssignments;
  });

  const unassignedStudents = students.length - sortedAssignments.length;
  if (unassignedStudents > 0) {
    warnings.push(`Unable to allocate ${unassignedStudents} student(s) because the rooms were full.`);
  }

  return {
    assignments: sortedAssignments,
    warnings,
    seatsByRoom,
  };
}

export function formatRoomSeatLayout(assignments = []) {
  const grouped = {};

  assignments.forEach((seat) => {
    if (!grouped[seat.roomNumber]) {
      grouped[seat.roomNumber] = [];
    }

    grouped[seat.roomNumber].push(seat);
  });

  return Object.entries(grouped).map(([roomNumber, seats]) => ({
    roomNumber,
    seats: [...seats].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      if (a.bench !== b.bench) return a.bench - b.bench;
      return a.seatNumber - b.seatNumber;
    }),
  }));
}
