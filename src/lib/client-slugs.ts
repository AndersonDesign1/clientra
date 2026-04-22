import type { Client } from "@/features/clients/mock-data";

export function getClientPathParam(client: Client) {
  return slugifyClientName(client.name) || client.id;
}

export function findClientByPathParam(clients: Client[], pathParam: string) {
  return clients.find(
    (client) =>
      client.id === pathParam || getClientPathParam(client) === pathParam
  );
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
