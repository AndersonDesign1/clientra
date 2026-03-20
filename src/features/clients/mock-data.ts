export interface Client {
  company: string;
  email: string;
  id: string;
  name: string;
  notes: string;
  phone: string;
  status: "active" | "archived";
  tags: string[];
  website: string;
}

export const clients: Client[] = [
  {
    id: "cli_1",
    name: "Jordan Lee",
    company: "Acme Inc.",
    email: "jordan@acme.co",
    phone: "+1 555-0101",
    website: "https://acme.co",
    status: "active",
    tags: ["retainer", "web"],
    notes: "Primary stakeholder for website refresh.",
  },
  {
    id: "cli_2",
    name: "Avery Stone",
    company: "Northstar Labs",
    email: "avery@northstar.dev",
    phone: "+1 555-0199",
    website: "https://northstar.dev",
    status: "active",
    tags: ["mobile"],
    notes: "Prefers weekly async updates.",
  },
];
