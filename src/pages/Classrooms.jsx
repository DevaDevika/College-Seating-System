import { useState } from "react";

function Classrooms() {
  const [rooms, setRooms] = useState([]);

  const [roomNumber, setRoomNumber] = useState("");
  const [rows, setRows] = useState("");
  const [benches, setBenches] = useState("");
  const [seats, setSeats] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  const addClassroom = (e) => {
  e.preventDefault();

  const capacity = Number(rows) * Number(benches) * Number(seats);

  const newRoom = {
    roomNumber,
    rows,
    benches,
    seats,
    capacity,
  };

  if (editIndex !== null) {
    const updatedRooms = [...rooms];
    updatedRooms[editIndex] = newRoom;
    setRooms(updatedRooms);
    setEditIndex(null);
  } else {
    setRooms([...rooms, newRoom]);
  }

  setRoomNumber("");
  setRows("");
  setBenches("");
  setSeats("");
};

  return (
    <div>
      <h1>Classroom Management</h1>
      <p>Add and configure examination classrooms.</p>

      <div className="form-card">
        <h2>Add Classroom</h2>

        <form onSubmit={addClassroom}>
          <label>Room Number</label>
          <input
            type="text"
            placeholder="Example: Room 101"
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

{rows && benches && seats && (
  <div className="capacity-preview">
    Total Capacity: <strong>{Number(rows) * Number(benches) * Number(seats)} Seats</strong>
  </div>
)}
          <button className="save-btn" type="submit">
            ADD CLASSROOM
          </button>
        </form>
      </div>

      {rooms.length > 0 && (
        <div className="form-card">
          <h2>Available Classrooms</h2>

          {rooms.map((room, index) => (
            <div className="student-item" key={index}>
  <div>
    <strong>{room.roomNumber}</strong>
    <p>
      {room.rows} Rows • {room.benches} Benches/Row •{" "}
      {room.seats} Seats/Bench
    </p>
    <p>Capacity: {room.capacity} Seats</p>
    <div className="seat-layout">
  {Array.from({ length: Number(room.rows) }).map((_, rowIndex) => (
    <div className="seat-row" key={rowIndex}>
      {Array.from({ length: Number(room.benches) }).map((_, benchIndex) => (
        <div className="bench" key={benchIndex}>
          {Array.from({ length: Number(room.seats) }).map((_, seatIndex) => (
            <span className="classroom-seat" key={seatIndex}>
  💺
</span>
          ))}
        </div>
      ))}
    </div>
  ))}
</div>
  </div>

  <div className="student-actions">
  <button
    className="edit-btn"
    onClick={() => {
      setRoomNumber(room.roomNumber);
      setRows(room.rows);
      setBenches(room.benches);
      setSeats(room.seats);
      setEditIndex(index);
    }}
  >
    EDIT
  </button>

  <button
    className="delete-btn"
    onClick={() =>
      setRooms(rooms.filter((_, i) => i !== index))
    }
  >
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

export default Classrooms;