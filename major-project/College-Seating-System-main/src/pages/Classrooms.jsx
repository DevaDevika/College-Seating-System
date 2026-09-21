import { useEffect, useState } from "react";

const STORAGE_KEY = "college-seating-rooms";

// Default pre-configured halls from the seating matrix (all enabled by default)
const DEFAULT_CLASSROOMS = [
  { roomNumber: "101", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "102", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "108", rows: "7", benches: "2", seats: "2", capacity: 28, isActive: true },
  { roomNumber: "205", rows: "7", benches: "2", seats: "2", capacity: 28, isActive: true },
  { roomNumber: "206", rows: "7", benches: "2", seats: "2", capacity: 28, isActive: true },
  { roomNumber: "L1", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "L2", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "L3", rows: "5", benches: "2", seats: "2", capacity: 20, isActive: true },
  { roomNumber: "L4", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "L5", rows: "5", benches: "2", seats: "2", capacity: 20, isActive: true },
  { roomNumber: "L6", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "MODEL CLASS", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "CAD LAB - EEE", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "CAD LAB - ME", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "LIBRARY BLOCK - EEE LAB", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "304", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "310", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "AUDITORIUM - TOP HALL", rows: "12", benches: "2", seats: "2", capacity: 48, isActive: true },
  { roomNumber: "HYDRAULICS LAB", rows: "5", benches: "2", seats: "2", capacity: 20, isActive: true },
  { roomNumber: "WORKSHOP", rows: "6", benches: "2", seats: "2", capacity: 24, isActive: true },
  { roomNumber: "Heat Engine", rows: "4", benches: "2", seats: "2", capacity: 16, isActive: true }
];

function Classrooms() {
  const [rooms, setRooms] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_CLASSROOMS;
    } catch {
      return DEFAULT_CLASSROOMS;
    }
  });

  const [roomNumber, setRoomNumber] = useState("");
  const [rows, setRows] = useState("");
  const [benches, setBenches] = useState("");
  const [seats, setSeats] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  }, [rooms]);

  const addClassroom = (e) => {
    e.preventDefault();

    const capacity = Number(rows) * Number(benches) * Number(seats);

    const newRoom = {
      roomNumber: roomNumber.trim(),
      rows,
      benches,
      seats,
      capacity,
      isActive,
    };

    if (editIndex !== null) {
      const updatedRooms = [...rooms];
      updatedRooms[editIndex] = newRoom;
      setRooms(updatedRooms);
      setEditIndex(null);
    } else {
      setRooms([...rooms, newRoom]);
    }

    resetForm();
  };

  const startEdit = (index) => {
    const room = rooms[index];
    setRoomNumber(room.roomNumber);
    setRows(room.rows);
    setBenches(room.benches);
    setSeats(room.seats);
    setIsActive(room.isActive !== undefined ? room.isActive : true);
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditIndex(null);
    resetForm();
  };

  const resetForm = () => {
    setRoomNumber("");
    setRows("");
    setBenches("");
    setSeats("");
    setIsActive(true);
  };

  const toggleRoomStatus = (index) => {
    const updated = [...rooms];
    updated[index].isActive = !updated[index].isActive;
    setRooms(updated);
  };

  const deleteRoom = (index) => {
    if (window.confirm("Are you sure you want to delete this classroom?")) {
      const updated = rooms.filter((_, i) => i !== index);
      setRooms(updated);
      if (editIndex === index) {
        cancelEdit();
      }
    }
  };

  const resetToDefaultRooms = () => {
    if (window.confirm("Reset classroom list to default examination halls?")) {
      setRooms(DEFAULT_CLASSROOMS);
      cancelEdit();
    }
  };

  const activeRoomsCount = rooms.filter((r) => r.isActive !== false).length;
  const activeCapacity = rooms
    .filter((r) => r.isActive !== false)
    .reduce((sum, r) => sum + Number(r.capacity || 0), 0);

  return (
    <div>
      <h1>Classroom Management</h1>
      <p>Add, edit, enable or disable examination classrooms.</p>

      <div className="student-summary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span>Active Rooms: <strong>{activeRoomsCount} / {rooms.length}</strong></span>
          <span style={{ marginLeft: "20px" }}>Available Capacity: <strong>{activeCapacity} Seats</strong></span>
        </div>
        <button type="button" className="clear-btn" onClick={resetToDefaultRooms}>
          🔄 Restore Default Halls
        </button>
      </div>

      <div className="form-card">
        <h2>{editIndex !== null ? "Edit Classroom" : "Create / Add Classroom"}</h2>

        <form onSubmit={addClassroom}>
          <label>Room Number / Hall Name</label>
          <input
            type="text"
            placeholder="Example: Room 101 or AUDITORIUM - TOP HALL"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            required
          />

          <div className="classroom-grid">
            <div>
              <label>Number of Rows</label>
              <input
                type="number"
                placeholder="Example: 5"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
                min="1"
                required
              />
            </div>

            <div>
              <label>Benches per Row</label>
              <input
                type="number"
                placeholder="Example: 6"
                value={benches}
                onChange={(e) => setBenches(e.target.value)}
                min="1"
                required
              />
            </div>

            <div>
              <label>Seats per Bench</label>
              <input
                type="number"
                placeholder="Example: 2"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          <div style={{ marginTop: "15px" }}>
            <label className="toggle-row" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span><strong>Enable this room for upcoming examination seating</strong></span>
            </label>
          </div>

          {rows && benches && seats && (
            <div className="capacity-preview" style={{ margin: "15px 0" }}>
              Calculated Capacity: <strong>{Number(rows) * Number(benches) * Number(seats)} Seats</strong>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <button className="save-btn" type="submit">
              {editIndex !== null ? "UPDATE CLASSROOM" : "ADD CLASSROOM"}
            </button>
            {editIndex !== null && (
              <button type="button" className="clear-btn" onClick={cancelEdit}>
                CANCEL
              </button>
            )}
          </div>
        </form>
      </div>

      {rooms.length > 0 && (
        <div className="form-card">
          <h2>Available Classrooms ({rooms.length})</h2>

          {rooms.map((room, index) => {
            const roomActive = room.isActive !== false;
            return (
              <div
                className="student-item"
                key={index}
                style={{
                  marginBottom: "15px",
                  padding: "12px",
                  borderBottom: "1px solid #eee",
                  opacity: roomActive ? 1 : 0.6,
                  backgroundColor: roomActive ? "transparent" : "#f5f5f5"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <strong style={{ fontSize: "1.1rem" }}>{room.roomNumber}</strong>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        backgroundColor: roomActive ? "#d1fae5" : "#fee2e2",
                        color: roomActive ? "#065f46" : "#991b1b"
                      }}
                    >
                      {roomActive ? "SELECTED FOR EXAM" : "DESELECTED"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0", color: "#666" }}>
                    {room.rows} Rows • {room.benches} Benches/Row • {room.seats} Seats/Bench
                  </p>
                  <p style={{ margin: 0, fontWeight: "bold" }}>
                    Capacity: {room.capacity} Seats
                  </p>
                </div>

                <div className="student-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="clear-btn"
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                    onClick={() => toggleRoomStatus(index)}
                  >
                    {roomActive ? "Deselect" : "Select"}
                  </button>

                  <button className="edit-btn" onClick={() => startEdit(index)}>
                    EDIT
                  </button>

                  <button className="delete-btn" onClick={() => deleteRoom(index)}>
                    DELETE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Classrooms;