export type DashboardActivityEvent =
  | {
      clientId: string;
      clientName: string;
      company: string;
      createdAt: string;
      id: string;
      type: "client_created";
    }
  | {
      clientId: string;
      clientName: string;
      createdAt: string;
      id: string;
      projectId: string;
      projectTitle: string;
      type: "project_created";
    }
  | {
      authorId: string;
      authorName: string;
      contentPreview: string;
      createdAt: string;
      id: string;
      projectId: string;
      projectTitle: string;
      type: "comment_added";
    }
  | {
      authorId: string;
      authorName: string;
      createdAt: string;
      fileId: string;
      fileName: string;
      id: string;
      projectId: string;
      projectTitle: string;
      type: "file_uploaded";
    };
