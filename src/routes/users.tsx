"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useReducer } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  deleteUser,
  type ManagedUser,
  updateUserRole,
  useUsersData,
} from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/users")({
  beforeLoad: requireAdminSession,
  component: UsersPage,
});

interface UsersPageState {
  deleteCandidate: ManagedUser | null;
  mutationError: string | null;
  pendingDeleteUserId: string | null;
  pendingRoleUserId: string | null;
  users: ManagedUser[] | null;
}

type UsersPageAction =
  | { type: "set-delete-candidate"; value: ManagedUser | null }
  | { type: "set-mutation-error"; value: string | null }
  | { type: "set-pending-delete-user-id"; value: string | null }
  | { type: "set-pending-role-user-id"; value: string | null }
  | { type: "set-users"; value: ManagedUser[] | null };

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
    case "set-users":
      return { ...state, users: action.value };
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
    users: null,
  });

  const visibleUsers = useMemo(
    () => state.users ?? usersQuery.data ?? [],
    [state.users, usersQuery.data]
  );

  async function handleRoleChange(userId: string, role: ManagedUser["role"]) {
    dispatch({ type: "set-mutation-error", value: null });
    dispatch({ type: "set-pending-role-user-id", value: userId });

    try {
      const updatedUser = await updateUserRole(userId, role);

      dispatch({
        type: "set-users",
        value: (state.users ?? usersQuery.data ?? []).map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        ),
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
      await deleteUser(user.id);
      dispatch({
        type: "set-users",
        value: (state.users ?? usersQuery.data ?? []).filter(
          (managedUser) => managedUser.id !== user.id
        ),
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
    (usersQuery.isLoading && !state.users) ||
    Boolean(usersQuery.error && !state.users);

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="font-semibold text-2xl">Users</h1>
        <p className="mt-1 text-slate-600 text-sm">
          Manage workspace access, adjust roles, and remove unwanted accounts.
        </p>
      </div>

      {state.mutationError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
          {state.mutationError}
        </div>
      ) : null}

      {state.deleteCandidate ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          <p className="font-medium">Confirm user deletion</p>
          <p className="mt-1">
            Delete {state.deleteCandidate.name} ({state.deleteCandidate.email})
            ? This will remove their sessions and linked account access.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              disabled={state.pendingDeleteUserId === state.deleteCandidate.id}
              onClick={() => {
                if (state.deleteCandidate) {
                  handleDelete(state.deleteCandidate);
                }
              }}
              type="button"
              variant="destructive"
            >
              {state.pendingDeleteUserId === state.deleteCandidate.id
                ? "Deleting..."
                : "Confirm delete"}
            </Button>
            <Button
              disabled={state.pendingDeleteUserId === state.deleteCandidate.id}
              onClick={() => {
                dispatch({ type: "set-delete-candidate", value: null });
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {usersQuery.isLoading && !state.users ? <LoadingPanel /> : null}
      {!usersQuery.isLoading && usersQuery.error && !state.users ? (
        <ErrorPanel description={usersQuery.error} />
      ) : null}
      {!hasBlockingState && visibleUsers.length === 0 ? (
        <EmptyPanel
          description="No user records are available right now."
          title="No users found"
        />
      ) : null}
      {visibleUsers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Verified</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Providers</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const isRolePending = state.pendingRoleUserId === user.id;
                const isDeletePending = state.pendingDeleteUserId === user.id;
                const isBusy = isRolePending || isDeletePending;

                return (
                  <tr className="border-t" key={user.id}>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">
                        {user.name}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{user.email}</td>
                    <td className="p-3">
                      <select
                        className="rounded-md border border-slate-200 bg-white px-2 py-1"
                        disabled={isBusy || isCurrentUser}
                        onChange={(event) =>
                          handleRoleChange(
                            user.id,
                            event.target.value as ManagedUser["role"]
                          )
                        }
                        value={user.role}
                      >
                        <option value="admin">admin</option>
                        <option value="client">client</option>
                      </select>
                    </td>
                    <td className="p-3">
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </td>
                    <td className="p-3 text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-slate-600">
                      {user.providers.length > 0
                        ? user.providers.join(", ")
                        : "email"}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          disabled={isBusy || isCurrentUser}
                          onClick={() => {
                            dispatch({
                              type: "set-delete-candidate",
                              value: user,
                            });
                          }}
                          type="button"
                          variant="destructive"
                        >
                          {isDeletePending ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </AppShell>
  );
}
