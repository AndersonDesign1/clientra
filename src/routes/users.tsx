import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useReducer } from "react";
import { requireAdminSession } from "@/auth/guards";
import { PageHeader } from "@/components/common/product-ui";
import { UsersPendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { AppShell } from "@/components/layout/app-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ensureUsersData,
  type ManagedUser,
  useDeleteUserMutation,
  useUpdateUserRoleMutation,
  useUsersData,
} from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/users")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) => ensureUsersData(context.queryClient),
  pendingComponent: UsersPendingPage,
  component: UsersPage,
});

interface UsersPageState {
  deleteCandidate: ManagedUser | null;
  mutationError: string | null;
  pendingDeleteUserId: string | null;
  pendingRoleUserId: string | null;
}

type UsersPageAction =
  | { type: "set-delete-candidate"; value: ManagedUser | null }
  | { type: "set-mutation-error"; value: string | null }
  | { type: "set-pending-delete-user-id"; value: string | null }
  | { type: "set-pending-role-user-id"; value: string | null };

function usersPageReducer(state: UsersPageState, action: UsersPageAction) {
  switch (action.type) {
    case "set-delete-candidate":
      return { ...state, deleteCandidate: action.value };
    case "set-mutation-error":
      return { ...state, mutationError: action.value };
    case "set-pending-delete-user-id":
      return { ...state, pendingDeleteUserId: action.value };
    case "set-pending-role-user-id":
      return { ...state, pendingRoleUserId: action.value };
    default:
      return state;
  }
}

function UsersPage() {
  const session = authClient.useSession();
  const currentUserId = session.data?.user?.id;
  const usersQuery = useUsersData();
  const [state, dispatch] = useReducer(usersPageReducer, {
    deleteCandidate: null,
    mutationError: null,
    pendingDeleteUserId: null,
    pendingRoleUserId: null,
  });
  const updateUserRoleMutation = useUpdateUserRoleMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const visibleUsers = usersQuery.data ?? [];

  async function handleRoleChange(userId: string, role: ManagedUser["role"]) {
    dispatch({ type: "set-mutation-error", value: null });
    dispatch({ type: "set-pending-role-user-id", value: userId });

    try {
      await updateUserRoleMutation.mutateAsync({
        id: userId,
        role,
      });
    } catch (error) {
      dispatch({
        type: "set-mutation-error",
        value:
          error instanceof Error
            ? error.message
            : "Unable to update user role.",
      });
    } finally {
      dispatch({ type: "set-pending-role-user-id", value: null });
    }
  }

  async function handleDelete(user: ManagedUser) {
    dispatch({ type: "set-mutation-error", value: null });
    dispatch({ type: "set-pending-delete-user-id", value: user.id });

    try {
      await deleteUserMutation.mutateAsync({
        id: user.id,
      });
    } catch (error) {
      dispatch({
        type: "set-mutation-error",
        value:
          error instanceof Error
            ? error.message
            : "Unable to delete that user.",
      });
    } finally {
      dispatch({ type: "set-delete-candidate", value: null });
      dispatch({ type: "set-pending-delete-user-id", value: null });
    }
  }

  const hasBlockingState =
    (usersQuery.isLoading && visibleUsers.length === 0) ||
    Boolean(usersQuery.error && visibleUsers.length === 0);

  return (
    <AppShell>
      <PageHeader
        description="Manage workspace access, adjust roles, and remove unwanted accounts."
        title="Users"
      />

      {state.mutationError ? (
        <div className="mb-4 rounded-xl border border-rose-200/50 bg-rose-50/10 p-4 text-rose-700 text-sm">
          {state.mutationError}
        </div>
      ) : null}

      {/* Delete User AlertDialog Modal */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            dispatch({ type: "set-delete-candidate", value: null });
          }
        }}
        open={Boolean(state.deleteCandidate)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm user deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {state.deleteCandidate?.name}
              </span>{" "}
              ({state.deleteCandidate?.email})? This will permanently remove
              their sessions and portal access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={state.pendingDeleteUserId === state.deleteCandidate?.id}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 font-bold transition-transform duration-100 hover:bg-rose-700 active:scale-[0.98]"
              disabled={state.pendingDeleteUserId === state.deleteCandidate?.id}
              onClick={(e) => {
                e.preventDefault();
                if (state.deleteCandidate) {
                  handleDelete(state.deleteCandidate);
                }
              }}
            >
              {state.pendingDeleteUserId === state.deleteCandidate?.id
                ? "Deleting..."
                : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {usersQuery.isLoading && visibleUsers.length === 0 ? (
        <LoadingPanel />
      ) : null}
      {!usersQuery.isLoading &&
      usersQuery.error &&
      visibleUsers.length === 0 ? (
        <ErrorPanel description={usersQuery.error} />
      ) : null}
      {!hasBlockingState && visibleUsers.length === 0 ? (
        <EmptyPanel
          description="No user records are available right now."
          title="No users found"
        />
      ) : null}
      {visibleUsers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
          <Table>
            <TableHeader className="border-border/40 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pr-4 pl-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Email
                </TableHead>
                <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Verified
                </TableHead>
                <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Joined
                </TableHead>
                <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Providers
                </TableHead>
                <TableHead className="pr-4 pl-4 text-right font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/15">
              {visibleUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const isRolePending = state.pendingRoleUserId === user.id;
                const isDeletePending = state.pendingDeleteUserId === user.id;
                const isBusy = isRolePending || isDeletePending;

                return (
                  <TableRow
                    className="transition-colors hover:bg-muted/5"
                    key={user.id}
                  >
                    <TableCell className="py-3.5 pr-4 pl-4">
                      <div className="font-medium text-foreground">
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <Select
                        disabled={isBusy || isCurrentUser}
                        onValueChange={(val) =>
                          handleRoleChange(user.id, val as ManagedUser["role"])
                        }
                        value={user.role}
                      >
                        <SelectTrigger className="h-8 w-24 border-border/40 bg-background font-semibold text-[11px] uppercase tracking-wider">
                          <SelectValue placeholder={user.role} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            className="font-semibold text-[11px] uppercase tracking-wider"
                            value="admin"
                          >
                            admin
                          </SelectItem>
                          <SelectItem
                            className="font-semibold text-[11px] uppercase tracking-wider"
                            value="client"
                          >
                            client
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-medium text-xs">
                      {user.emailVerified ? (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-bold text-[9px] text-emerald-700 uppercase tracking-wider">
                          Verified
                        </span>
                      ) : (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-bold text-[9px] text-amber-700 uppercase tracking-wider">
                          Unverified
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-muted-foreground text-xs">
                      {user.providers.length > 0
                        ? user.providers.join(", ")
                        : "email"}
                    </TableCell>
                    <TableCell className="py-3.5 pr-4 pl-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="h-8 w-8 transition-transform duration-200 hover:scale-105 active:scale-95"
                          disabled={isBusy || isCurrentUser}
                          onClick={() => {
                            dispatch({
                              type: "set-delete-candidate",
                              value: user,
                            });
                          }}
                          size="icon"
                          type="button"
                          variant="destructive"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </AppShell>
  );
}
