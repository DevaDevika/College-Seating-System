import {
  getAdminByUsername,
  createSession,
  getSession,
  deleteSession,
} from "./db";

import {
  verifyPassword,
  generateSessionToken,
  hashSessionToken,
} from "./auth";

export interface Env {
  college_seating_db: D1Database;
}

const SESSION_DURATION_DAYS = 7;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function createSessionCookie(token: string, expiresAt: Date): string {
  return [
    `admin_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Expires=${expiresAt.toUTCString()}`,
  ].join("; ");
}

function createExpiredSessionCookie(): string {
  return [
    "admin_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
  ].join("; ");
}

async function requireAdmin(
  request: Request,
  db: D1Database
) {
  const token = getCookie(request, "admin_session");

  if (!token) {
    return null;
  }

  const tokenHash = await hashSessionToken(token);

  return await getSession(db, tokenHash);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    /*
     * ----------------------------------------------------------
     * HEALTH CHECK
     * ----------------------------------------------------------
     */

    if (
      url.pathname === "/api/health" &&
      request.method === "GET"
    ) {
      try {
        const result = await env.college_seating_db
          .prepare("SELECT 1 AS ok")
          .first<{ ok: number }>();

        return json({
          success: true,
          database: result?.ok === 1 ? "connected" : "not connected",
        });
      } catch (error) {
        return json(
          {
            success: false,
            database: "connection failed",
            error:
              error instanceof Error
                ? error.message
                : "Unknown error",
          },
          500
        );
      }
    }

    /*
     * ----------------------------------------------------------
     * ADMIN LOGIN
     * ----------------------------------------------------------
     */

    if (
      url.pathname === "/api/auth/login" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json<{
          username?: string;
          password?: string;
        }>();

        const username = body.username?.trim();
        const password = body.password;

        if (!username || !password) {
          return json(
            {
              success: false,
              message: "Username and password are required.",
            },
            400
          );
        }

        const admin = await getAdminByUsername(
          env.college_seating_db,
          username
        );

        if (!admin) {
          return json(
            {
              success: false,
              message: "Invalid username or password.",
            },
            401
          );
        }

        const validPassword = await verifyPassword(
          password,
          admin.password_hash
        );

        if (!validPassword) {
          return json(
            {
              success: false,
              message: "Invalid username or password.",
            },
            401
          );
        }

        const sessionToken = generateSessionToken();
        const tokenHash = await hashSessionToken(sessionToken);

        const expiresAt = new Date(
          Date.now() +
            SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
        );

        await createSession(
          env.college_seating_db,
          admin.id,
          tokenHash,
          expiresAt.toISOString()
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "Login successful.",
            admin: {
              id: admin.id,
              username: admin.username,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": createSessionCookie(
                sessionToken,
                expiresAt
              ),
            },
          }
        );
      } catch {
        return json(
          {
            success: false,
            message: "Invalid request.",
          },
          400
        );
      }
    }

    /*
     * ----------------------------------------------------------
     * CURRENT ADMIN
     * ----------------------------------------------------------
     */

    if (
      url.pathname === "/api/auth/me" &&
      request.method === "GET"
    ) {
      const session = await requireAdmin(
        request,
        env.college_seating_db
      );

      if (!session) {
        return json(
          {
            success: false,
            message: "Authentication required.",
          },
          401
        );
      }

      return json({
        success: true,
        admin: {
          id: session.admin_id,
          username: session.username,
        },
      });
    }

    /*
     * ----------------------------------------------------------
     * LOGOUT
     * ----------------------------------------------------------
     */

    if (
      url.pathname === "/api/auth/logout" &&
      request.method === "POST"
    ) {
      const token = getCookie(request, "admin_session");

      if (token) {
        const tokenHash = await hashSessionToken(token);

        await deleteSession(
          env.college_seating_db,
          tokenHash
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Logged out successfully.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": createExpiredSessionCookie(),
          },
        }
      );
    }

    /*
     * ----------------------------------------------------------
     * PROTECTED TEST ENDPOINT
     * ----------------------------------------------------------
     */

    if (
      url.pathname === "/api/admin-test" &&
      request.method === "GET"
    ) {
      const session = await requireAdmin(
        request,
        env.college_seating_db
      );

      if (!session) {
        return json(
          {
            success: false,
            message: "Authentication required.",
          },
          401
        );
      }

      return json({
        success: true,
        message: "You are authenticated as an admin.",
        username: session.username,
      });
    }
/*
 * ----------------------------------------------------------
 * EXAMS
 * ----------------------------------------------------------
 */

// GET ALL EXAMS
if (
  url.pathname === "/api/exams" &&
  request.method === "GET"
) {
  try {
    const result = await env.college_seating_db
      .prepare(`
        SELECT
          id,
          exam_date,
          subject,
          subject_code,
          exam_code,
          start_time,
          end_time,
          created_at,
          updated_at
        FROM exams
        ORDER BY exam_date DESC, start_time DESC
      `)
      .all();

    return json({
      success: true,
      exams: result.results,
    });
  } catch (error) {
    console.error("Get exams error:", error);

    return json(
      {
        success: false,
        message: "Failed to fetch exams.",
      },
      500
    );
  }
}


// CREATE EXAM
if (
  url.pathname === "/api/exams" &&
  request.method === "POST"
) {
  const session = await requireAdmin(
    request,
    env.college_seating_db
  );

  if (!session) {
    return json(
      {
        success: false,
        message: "Authentication required.",
      },
      401
    );
  }

  let body: {
    exam_date?: string;
    subject?: string;
    subject_code?: string;
    exam_code?: string;
    start_time?: string;
    end_time?: string;
  };

  try {
    body = await request.json();
  } catch {
    return json(
      {
        success: false,
        message: "Invalid JSON body.",
      },
      400
    );
  }

  const examDate = String(body.exam_date ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const subjectCode = String(body.subject_code ?? "").trim();
  const examCode = String(body.exam_code ?? "").trim();
  const startTime = String(body.start_time ?? "").trim();
  const endTime = String(body.end_time ?? "").trim();

  if (!examDate || !subject || !startTime) {
    return json(
      {
        success: false,
        message:
          "exam_date, subject and start_time are required.",
      },
      400
    );
  }

  try {
    const result = await env.college_seating_db
      .prepare(`
        INSERT INTO exams (
          exam_date,
          subject,
          subject_code,
          exam_code,
          start_time,
          end_time
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        examDate,
        subject,
        subjectCode || null,
        examCode || null,
        startTime,
        endTime || null
      )
      .run();

    return json(
      {
        success: true,
        message: "Exam created successfully.",
        exam: {
          id: result.meta.last_row_id,
          exam_date: examDate,
          subject,
          subject_code: subjectCode || null,
          exam_code: examCode || null,
          start_time: startTime,
          end_time: endTime || null,
        },
      },
      201
    );
  } catch (error) {
    console.error("Create exam error:", error);

    return json(
      {
        success: false,
        message: "Failed to create exam.",
      },
      500
    );
  }
}
    /*
 * --------------------------------------------------
 * CREATE CLASSROOM
 * --------------------------------------------------
 */
// GET ALL CLASSROOMS
if (
  url.pathname === "/api/classrooms" &&
  request.method === "GET"
) {
  const result = await env.college_seating_db
    .prepare(`
      SELECT id, room_number, rows, columns, created_at, updated_at
      FROM classrooms
      ORDER BY room_number
    `)
    .all();

  return json({
    success: true,
    classrooms: result.results,
  });
}
if (
  url.pathname === "/api/classrooms" &&
  request.method === "POST"
) {
  const session = await requireAdmin(
    request,
    env.college_seating_db
  );

  if (!session) {
    return json(
      {
        success: false,
        message: "Authentication required.",
      },
      401
    );
  }

  let body: {
    room_number?: string;
    rows?: number;
    columns?: number;
  };

  try {
    body = await request.json();
  } catch {
    return json(
      {
        success: false,
        message: "Invalid JSON body.",
      },
      400
    );
  }

  const roomNumber = String(body.room_number ?? "").trim();
  const rows = Number(body.rows);
  const columns = Number(body.columns);

  if (
    !roomNumber ||
    !Number.isInteger(rows) ||
    !Number.isInteger(columns) ||
    rows <= 0 ||
    columns <= 0
  ) {
    return json(
      {
        success: false,
        message: "room_number, rows and columns are required.",
      },
      400
    );
  }

  try {
    const result = await env.college_seating_db
      .prepare(
        `INSERT INTO classrooms (room_number, rows, columns)
         VALUES (?, ?, ?)`
      )
      .bind(roomNumber, rows, columns)
      .run();

    return json(
      {
        success: true,
        message: "Classroom created successfully.",
        classroom: {
          id: result.meta.last_row_id,
          room_number: roomNumber,
          rows,
          columns,
        },
      },
      201
    );
  } catch (error) {
    console.error("Create classroom error:", error);

    return json(
      {
        success: false,
        message: "Failed to create classroom.",
      },
      500
    );
  }
}

// UPDATE CLASSROOM
if (
  url.pathname.startsWith("/api/classrooms/") &&
  request.method === "PUT"
) {
  const session = await requireAdmin(
    request,
    env.college_seating_db
  );

  if (!session) {
    return json(
      {
        success: false,
        message: "Authentication required.",
      },
      401
    );
  }

  const id = url.pathname.split("/").pop();

  if (!id || !/^\d+$/.test(id)) {
    return json(
      {
        success: false,
        message: "Invalid classroom ID.",
      },
      400
    );
  }

  let body: {
    room_number?: string;
    rows?: number;
    columns?: number;
  };

  try {
    body = await request.json();
  } catch {
    return json(
      {
        success: false,
        message: "Invalid JSON body.",
      },
      400
    );
  }

  const roomNumber = String(body.room_number ?? "").trim();
  const rows = Number(body.rows);
  const columns = Number(body.columns);

  if (
    !roomNumber ||
    !Number.isInteger(rows) ||
    !Number.isInteger(columns) ||
    rows <= 0 ||
    columns <= 0
  ) {
    return json(
      {
        success: false,
        message: "room_number, rows and columns are required.",
      },
      400
    );
  }

  const existing = await env.college_seating_db
    .prepare("SELECT id FROM classrooms WHERE id = ?")
    .bind(Number(id))
    .first();

  if (!existing) {
    return json(
      {
        success: false,
        message: "Classroom not found.",
      },
      404
    );
  }

  await env.college_seating_db
    .prepare(`
      UPDATE classrooms
      SET room_number = ?,
          rows = ?,
          columns = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(roomNumber, rows, columns, Number(id))
    .run();

  const classroom = await env.college_seating_db
    .prepare(`
      SELECT id, room_number, rows, columns, created_at, updated_at
      FROM classrooms
      WHERE id = ?
    `)
    .bind(Number(id))
    .first();

  return json({
    success: true,
    message: "Classroom updated successfully.",
    classroom,
  });
}

// DELETE CLASSROOM
if (
  url.pathname.startsWith("/api/classrooms/") &&
  request.method === "DELETE"
) {
  const session = await requireAdmin(
    request,
    env.college_seating_db
  );

  if (!session) {
    return json(
      {
        success: false,
        message: "Authentication required.",
      },
      401
    );
  }

  const id = url.pathname.split("/").pop();
  const classroomId = Number(id);

  if (!id || !Number.isInteger(classroomId) || classroomId <= 0) {
    return json(
      {
        success: false,
        message: "Invalid classroom ID.",
      },
      400
    );
  }

  const existing = await env.college_seating_db
    .prepare("SELECT id FROM classrooms WHERE id = ?")
    .bind(classroomId)
    .first();

  if (!existing) {
    return json(
      {
        success: false,
        message: "Classroom not found.",
      },
      404
    );
  }

  await env.college_seating_db
    .prepare("DELETE FROM classrooms WHERE id = ?")
    .bind(classroomId)
    .run();

  return json({
    success: true,
    message: "Classroom deleted successfully.",
  });
}
    /*
     * ----------------------------------------------------------
     * UNKNOWN ROUTE
     * ----------------------------------------------------------
     */

    return json(
      {
        success: false,
        message: "Route not found.",
      },
      404
    );
  },
} satisfies ExportedHandler<Env>;