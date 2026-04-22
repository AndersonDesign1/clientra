import type { Client } from "@/features/clients/mock-data";

export function getClientPathParam(client: Client) {
  const slug = slugifyClientName(client.name);
  return slug ? `${slug}-${client.id}` : client.id;
}

export function findClientByPathParam(clients: Client[], pathParam: string) {
  const exactMatch = clients.find(
    (client) =>
      client.id === pathParam || getClientPathParam(client) === pathParam
  );

  if (exactMatch) {
    return exactMatch;
  }

  const slugMatches = clients.filter(
    (client) => slugifyClientName(client.name) === pathParam
  );

  return slugMatches.length === 1 ? slugMatches[0] : undefined;
}

function slugifyClientName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
