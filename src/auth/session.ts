import { createServerFn } from "@tanstack/react-start";
import { getSessionUserFromHeaders } from "./session.server";

export const getSessionUser = createServerFn({ method: "GET" }).handler(
  async () => getSessionUserFromHeaders()
);
