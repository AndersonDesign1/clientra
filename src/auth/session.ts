import { createIsomorphicFn } from "@tanstack/react-start";
import { authClient } from "@/lib/auth-client";
import { normalizeSessionUser } from "./session-utils";

export const getSessionUser = createIsomorphicFn()
  .client(async () => {
    const session = await authClient.getSession();
    return normalizeSessionUser(session.data);
  })
  .server(async () => {
    const { getSessionUserFromHeaders } = await import("./session.server");
    return getSessionUserFromHeaders();
  });
