import type { GraphQLContext } from "$graphql/graphql-context";
import { instructorsQuerySchema } from "$schema";
import { InstructorsService } from "$services";
import { GraphQLError } from "graphql/error";

export const instructorsResolvers = {
  Query: {
    instructor: async (_: unknown, { ucinetid }: { ucinetid: string }, { db }: GraphQLContext) => {
      const service = new InstructorsService(db);
      const res = await service.getInstructorByUCInetID(ucinetid);
      if (!res)
        throw new GraphQLError(`Instructor '${ucinetid}' not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      return res;
    },
    instructors: async (_: unknown, args: { query: unknown }, { db }: GraphQLContext) => {
      const service = new InstructorsService(db);
      return await service.getInstructors(instructorsQuerySchema.parse(args.query));
    },
  },
};
