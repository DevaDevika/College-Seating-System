"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

type Classroom = {
  id: number;
  room_number: string;
  rows: number;
  columns: number;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  room_number: string;
  rows: string;
  columns: string;
};

const emptyForm: FormState = {
  room_number: "",
  rows: "",
  columns: "",
};

export default function ClassroomManager() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Classroom | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isEditing = editingId !== null;

  async function loadClassrooms(silent = false) {
    if (!silent) {
      setLoading(true);
    }

    try {
      const { status, data } = await apiRequest<{ classrooms?: Classroom[] }>(
        "/api/classrooms"
      );

      if (status !== 200 || !data.success) {
        setMessage({
          type: "error",
          text: data.message ?? "Could not load classrooms.",
        });
        return;
      }

      setClassrooms(data.classrooms ?? []);
    } catch {
      setMessage({
        type: "error",
        text: "Could not reach the classroom API. Confirm the backend is running.",
      });
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadClassrooms();
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(classroom: Classroom) {
    setEditingId(classroom.id);
    setForm({
      room_number: classroom.room_number,
      rows: String(classroom.rows),
      columns: String(classroom.columns),
    });
    setMessage(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const roomNumber = form.room_number.trim();
    const rows = Number(form.rows);
    const columns = Number(form.columns);

    if (
      !roomNumber ||
      !Number.isInteger(rows) ||
      !Number.isInteger(columns) ||
      rows <= 0 ||
      columns <= 0
    ) {
      setMessage({
        type: "error",
        text: "Enter a room number and positive whole numbers for rows and columns.",
      });
      return;
    }

    setSaving(true);

    try {
      const path =
        editingId === null
          ? "/api/classrooms"
          : `/api/classrooms/${editingId}`;

      const { status, data } = await apiRequest(path, {
        method: editingId === null ? "POST" : "PUT",
        body: JSON.stringify({
          room_number: roomNumber,
          rows,
          columns,
        }),
      });

      if (!data.success) {
        setMessage({
          type: "error",
          text:
            data.message ??
            (status === 401
              ? "Authentication required."
              : "Could not save the classroom."),
        });
        return;
      }

      setMessage({
        type: "success",
        text:
          data.message ??
          (editingId === null
            ? "Classroom created successfully."
            : "Classroom updated successfully."),
      });
      resetForm();
      await loadClassrooms(true);
    } catch {
      setMessage({
        type: "error",
        text: "Could not save the classroom.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeletingId(pendingDelete.id);
    setMessage(null);

    try {
      const { data } = await apiRequest(
        `/api/classrooms/${pendingDelete.id}`,
        { method: "DELETE" }
      );

      if (!data.success) {
        setMessage({
          type: "error",
          text: data.message ?? "Could not delete the classroom.",
        });
        return;
      }

      if (editingId === pendingDelete.id) {
        resetForm();
      }

      setMessage({
        type: "success",
        text: data.message ?? "Classroom deleted successfully.",
      });
      setPendingDelete(null);
      await loadClassrooms(true);
    } catch {
      setMessage({
        type: "error",
        text: "Could not delete the classroom.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const sortedClassrooms = useMemo(
    () =>
      [...classrooms].sort((a, b) =>
        a.room_number.localeCompare(b.room_number, undefined, {
          numeric: true,
        })
      ),
    [classrooms]
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Classroom management
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          Define examination rooms, grid size, and seating capacity before
          allocating students.
        </p>
      </div>

      {message ? (
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h3 className="mb-4 text-base font-semibold">
          {isEditing ? "Edit classroom" : "Add classroom"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Room number
            </span>
            <input
              value={form.room_number}
              onChange={(event) =>
                updateField("room_number", event.target.value)
              }
              placeholder="101"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Rows
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={form.rows}
              onChange={(event) => updateField("rows", event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Columns
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={form.columns}
              onChange={(event) => updateField("columns", event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Update classroom"
                : "Add classroom"}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold">Available rooms</h3>
          {loading ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : (
            <span className="text-sm text-slate-500">
              {sortedClassrooms.length} room
              {sortedClassrooms.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : sortedClassrooms.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            No classrooms yet. Add a room to start planning seating.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-medium">Room</th>
                    <th className="px-5 py-3 font-medium">Rows</th>
                    <th className="px-5 py-3 font-medium">Columns</th>
                    <th className="px-5 py-3 font-medium">Capacity</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClassrooms.map((classroom) => (
                    <tr
                      key={classroom.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-3 font-medium">
                        {classroom.room_number}
                      </td>
                      <td className="px-5 py-3">{classroom.rows}</td>
                      <td className="px-5 py-3">{classroom.columns}</td>
                      <td className="px-5 py-3">
                        {classroom.rows * classroom.columns} seats
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(classroom)}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(classroom)}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {sortedClassrooms.map((classroom) => (
                <article
                  key={classroom.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-base font-semibold">
                    Room {classroom.room_number}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {classroom.rows} rows × {classroom.columns} columns ·{" "}
                    {classroom.rows * classroom.columns} seats
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(classroom)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(classroom)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-classroom-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3
              id="delete-classroom-title"
              className="text-lg font-semibold text-slate-900"
            >
              Delete classroom?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Room {pendingDelete.room_number} will be removed. This cannot be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === pendingDelete.id}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deletingId === pendingDelete.id
                  ? "Deleting..."
                  : "Delete room"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
