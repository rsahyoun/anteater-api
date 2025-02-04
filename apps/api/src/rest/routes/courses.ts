import { defaultHook } from "$hooks";
import { productionCache } from "$middleware";
import {
  batchCoursesQuerySchema,
  courseSchema,
  coursesByCursorQuerySchema,
  coursesPathSchema,
  coursesQuerySchema,
  cursorResponseSchema,
  errorSchema,
  prerequisiteSchema,
  prerequisiteTreeSchema,
  responseSchema,
} from "$schema";
import { CoursesService } from "$services";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { database } from "@packages/db";

const coursesRouter = new OpenAPIHono<{ Bindings: Env }>({ defaultHook });
const coursesCursorRouter = new OpenAPIHono<{ Bindings: Env }>({ defaultHook });

coursesRouter.openAPIRegistry.register("prereq", prerequisiteSchema);
coursesRouter.openAPIRegistry.register("prereqTree", prerequisiteTreeSchema);

const batchCoursesRoute = createRoute({
  summary: "Retrieve courses with IDs",
  operationId: "batchCourses",
  tags: ["Courses"],
  method: "get",
  path: "/batch",
  request: { query: batchCoursesQuerySchema },
  description: "Retrieves courses with the IDs provided",
  responses: {
    200: {
      content: {
        "application/json": { schema: responseSchema(courseSchema.array()) },
      },
      description: "Successful operation",
    },
    422: {
      content: { "application/json": { schema: errorSchema } },
      description: "Parameters failed validation",
    },
    500: {
      content: { "application/json": { schema: errorSchema } },
      description: "Server error occurred",
    },
  },
});

const courseByIdRoute = createRoute({
  summary: "Retrieve a course",
  operationId: "courseById",
  tags: ["Courses"],
  method: "get",
  path: "/{id}",
  request: { params: coursesPathSchema },
  description:
    "Retrieves detailed information about a specific course, including its prerequisites, units, description, and other course details.",
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema(courseSchema) } },
      description: "Successfully retrieved the course information",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Course not found with the specified ID",
    },
    422: {
      content: { "application/json": { schema: errorSchema } },
      description: "Invalid course ID format provided",
    },
    500: {
      content: { "application/json": { schema: errorSchema } },
      description: "Server error occurred while retrieving the course",
    },
  },
});

const batchCoursesRoute = createRoute({
  summary: "Retrieve multiple courses",
  operationId: "batchCourses",
  tags: ["Courses"],
  method: "get",
  path: "/batch",
  request: { query: batchCoursesQuerySchema },
  description:
    "Retrieves information for multiple courses at once using a comma-separated list of course IDs",
  responses: {
    200: {
      content: {
        "application/json": { schema: responseSchema(courseSchema.array()) },
      },
      description: "Successfully retrieved the requested courses",
    },
    422: {
      content: { "application/json": { schema: errorSchema } },
      description: "Invalid course IDs format provided",
    },
    500: {
      content: { "application/json": { schema: errorSchema } },
      description: "Server error occurred while retrieving the courses",
    },
  },
});

const coursesByFiltersRoute = createRoute({
  summary: "Filter courses",
  operationId: "coursesByFilters",
  tags: ["Courses"],
  method: "get",
  path: "/",
  request: { query: coursesQuerySchema },
  description:
    "Retrieves courses matching the given filters. Supports filtering by department, course number, title, description, GE category, and more.",
  responses: {
    200: {
      content: {
        "application/json": { schema: responseSchema(courseSchema.array()) },
      },
      description: "Successfully retrieved the filtered courses",
    },
    422: {
      content: { "application/json": { schema: errorSchema } },
      description: "Invalid filter parameters provided",
    },
    500: {
      content: { "application/json": { schema: errorSchema } },
      description: "Server error occurred while filtering courses",
    },
  },
});

const coursesByCursorRoute = createRoute({
  summary: "Filter courses with cursor pagination",
  operationId: "coursesByCursor",
  tags: ["Courses"],
  method: "get",
  path: "/",
  request: { query: coursesByCursorQuerySchema },
  description:
    "Retrieves courses matching the given filters with cursor-based pagination. Provides efficient navigation through large result sets.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: cursorResponseSchema(courseSchema.array()),
          example: {
            ok: true,
            data: {
              items: [
                {
                  id: "COMPSCI161",
                  title: "Design and Analysis of Algorithms",
                  department: "COMPSCI",
                  courseNumber: "161",
                  // ... other course fields
                },
              ],
              nextCursor: "eyJpZCI6IkNPTVBTQ0kxNjEifQ==", // Base64 encoded: {"id":"COMPSCI161"}
            },
          },
        },
      },
      description: "Successfully retrieved the paginated course results",
    },
    422: {
      content: { "application/json": { schema: errorSchema } },
      description: "Invalid filter parameters or cursor provided",
    },
    500: {
      content: { "application/json": { schema: errorSchema } },
      description: "Server error occurred while retrieving courses",
    },
  },
});

coursesRouter.get(
  "*",
  productionCache({ cacheName: "anteater-api", cacheControl: "max-age=86400" }),
);

coursesRouter.openapi(batchCoursesRoute, async (c) => {
  const { ids } = c.req.valid("query");
  const service = new CoursesService(database(c.env.DB.connectionString));
  return c.json(
    {
      ok: true,
      data: courseSchema.array().parse(await service.batchGetCourses(ids)),
    },
    200,
  );
});

coursesRouter.openapi(courseByIdRoute, async (c) => {
  const { id } = c.req.valid("param");
  const service = new CoursesService(database(c.env.DB.connectionString));
  const res = await service.getCourseById(id);
  return res
    ? c.json({ ok: true, data: courseSchema.parse(res) }, 200)
    : c.json({ ok: false, message: `Course ${id} not found` }, 404);
});

coursesRouter.openapi(coursesByFiltersRoute, async (c) => {
  const query = c.req.valid("query");
  const service = new CoursesService(database(c.env.DB.connectionString));
  return c.json(
    {
      ok: true,
      data: courseSchema.array().parse(await service.getCourses(query)),
    },
    200,
  );
});

coursesCursorRouter.openapi(coursesByCursorRoute, async (c) => {
  const query = c.req.valid("query");
  const service = new CoursesService(database(c.env.DB.connectionString));

  const { items, nextCursor } = await service.getCoursesByCursor(query);
  return c.json(
    {
      ok: true,
      data: {
        items: courseSchema.array().parse(items),
        nextCursor: nextCursor,
      },
    },
    200,
  );
});

export { coursesRouter, coursesCursorRouter };
