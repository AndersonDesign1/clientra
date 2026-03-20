"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

function UsersPage() {
  const session = authClient.useSession();
  const currentUserId = session.data?.user?.id;
  const usersQuery = useUsersData();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingRoleUserId, setPendingRoleUserId] = useState<string | null>(
    null
  );
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(
    null
  );
  const [deleteCandidate, setDeleteCandidate] = useState<ManagedUser | null>(
    null
  );

  const visibleUsers = useMemo(
    () => users ?? usersQuery.data ?? [],
    [users, usersQuery.data]
  );

  async function handleRoleChange(userId: string, role: ManagedUser["role"]) {
    setMutationError(null);
    setPendingRoleUserId(userId);

    try {
      const updatedUser = await updateUserRole(userId, role);

      setUsers((current) =>
        (current ?? usersQuery.data ?? []).map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to update user role."
      );
    } finally {
      setPendingRoleUserId(null);
    }
  }

  async function handleDelete(user: ManagedUser) {
    setMutationError(null);
    setPendingDeleteUserId(user.id);

    try {
      await deleteUser(user.id);
      setUsers((current) =>
        (current ?? usersQuery.data ?? []).filter(
          (managedUser) => managedUser.id !== user.id
        )
      );
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to delete that user."
      );
    } finally {
      setDeleteCandidate(null);
      setPendingDeleteUserId(null);
    }
  }

  const hasBlockingState =
    (usersQuery.isLoading && !users) || Boolean(usersQuery.error && !users);

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="font-semibold text-2xl">Users</h1>
        <p className="mt-1 text-slate-600 text-sm">
          Manage workspace access, adjust roles, and remove unwanted accounts.
        </p>
      </div>

      {mutationError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
          {mutationError}
        </div>
      ) : null}

      {deleteCandidate ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          <p className="font-medium">Confirm user deletion</p>
          <p className="mt-1">
            Delete {deleteCandidate.name} ({deleteCandidate.email})? This will
            remove their sessions and linked account access.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              disabled={pendingDeleteUserId === deleteCandidate.id}
              onClick={() => {
                handleDelete(deleteCandidate);
              }}
              type="button"
              variant="destructive"
            >
              {pendingDeleteUserId === deleteCandidate.id
                ? "Deleting..."
                : "Confirm delete"}
            </Button>
            <Button
              disabled={pendingDeleteUserId === deleteCandidate.id}
              onClick={() => {
                setDeleteCandidate(null);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {usersQuery.isLoading && !users ? <LoadingPanel /> : null}
      {!usersQuery.isLoading && usersQuery.error && !users ? (
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
                const isRolePending = pendingRoleUserId === user.id;
                const isDeletePending = pendingDeleteUserId === user.id;
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
                            setDeleteCandidate(user);
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
