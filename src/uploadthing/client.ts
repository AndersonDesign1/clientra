import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "./core";

export const { useUploadThing } = generateReactHelpers<UploadRouter>({
  url: "/api/uploadthing",
});
