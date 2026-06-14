import QueryTable from "@components/tables/query_table";
import { build_deep_partial_schema } from "@lib/build_partial_schema";
import { FilterParser } from "@lib/filter";
import { QuerySchema } from "@dto/query_type";
import { type JSX } from "react";
import z from "zod";

interface UserProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserPage({
  searchParams,
}: Readonly<UserProps>): Promise<JSX.Element> {
  const params = (await searchParams) ?? {};

  const parser = new FilterParser(
    build_deep_partial_schema(QuerySchema).extend({
      page: z.number().positive().optional().default(1),
      limit: z.number().positive().optional().default(10),
    }),
    {
      array_encoding: "comma",
    },
  );

  const t = parser.parse_json(params);
  return (
    <div>
      <QueryTable filters={t.is_ok() ? t.value : null} />
    </div>
  );
}