import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthUser } from '../../hooks/useAuth';
import { apiService, User as ApiUser } from '../../services/api';

interface AccountSettingsProps {
  user?: AuthUser | null;
}

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  imageUrl: string;
  role: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type NewUserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const createFormState = (user?: Partial<ApiUser>): FormState => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  phoneNumber: user?.phoneNumber || '',
  address: user?.address || '',
  imageUrl: user?.imageUrl || '',
  role: user?.role || '',
});

const emptyPasswordState: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const emptyNewUserState: NewUserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

export default function AccountSettings({ user }: AccountSettingsProps) {
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(createFormState());
  const [initialData, setInitialData] = useState<FormState | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordState);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [newUserForm, setNewUserForm] = useState<NewUserFormState>(emptyNewUserState);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userManagementError, setUserManagementError] = useState<string | null>(null);
  const [userManagementSuccess, setUserManagementSuccess] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!userId) {
        setError('No authenticated user found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getUser(userId);
        if (!isMounted) {
          return;
        }

        if (response.data) {
          const filled = createFormState(response.data);
          setFormData(filled);
          setInitialData(filled);
        } else {
          setError(response.error || 'Unable to load user profile.');
        }
      } catch {
        if (isMounted) {
          setError('Failed to load user profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const loadUsers = useCallback(async () => {
    if (!userId) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await apiService.getUsers();
      if (response.data) {
        setUsers(response.data);
      } else {
        setUsersError(response.error || 'Failed to load users.');
      }
    } catch {
      setUsersError('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    return Object.keys(initialData).some((key) => {
      const typedKey = key as keyof FormState;
      return initialData[typedKey] !== formData[typedKey];
    });
  }, [formData, initialData]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !hasChanges) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        imageUrl: formData.imageUrl.trim() || undefined,
        role: formData.role.trim() || undefined,
      };

      const response = await apiService.updateUser(userId, payload);

      if (response.data) {
        const updated = createFormState(response.data);
        setFormData(updated);
        setInitialData(updated);
        setSuccessMessage('Account details updated successfully.');
      } else {
        setError(response.error || 'Failed to update account.');
      }
    } catch {
      setError('Failed to update account.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordFieldChange = (field: keyof PasswordFormState, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) {
      return;
    }

    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await apiService.changePassword(userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.error) {
        setPasswordError(response.error);
        return;
      }

      setPasswordSuccess(response.data?.message || 'Password updated successfully.');
      setPasswordForm(emptyPasswordState);
    } catch {
      setPasswordError('Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const canSubmitPassword = Boolean(
    passwordForm.currentPassword && passwordForm.newPassword && passwordForm.confirmPassword && !passwordSaving
  );

  const handleNewUserFieldChange = (field: keyof NewUserFormState, value: string) => {
    setNewUserForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const canCreateUser = Boolean(
    newUserForm.firstName &&
    newUserForm.lastName &&
    newUserForm.email &&
    newUserForm.password.length >= 8 &&
    !creatingUser
  );

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) {
      return;
    }

    setUserManagementError(null);
    setUserManagementSuccess(null);

    if (!newUserForm.firstName || !newUserForm.lastName || !newUserForm.email || !newUserForm.password) {
      setUserManagementError('Please fill in all fields to create a user.');
      return;
    }

    if (newUserForm.password.length < 8) {
      setUserManagementError('Password must be at least 8 characters long.');
      return;
    }

    setCreatingUser(true);
    try {
      const response = await apiService.createUser({
        firstName: newUserForm.firstName.trim(),
        lastName: newUserForm.lastName.trim(),
        email: newUserForm.email.trim(),
        password: newUserForm.password,
      });

      if (response.error) {
        setUserManagementError(response.error);
      } else {
        setUserManagementSuccess('User created successfully.');
        setNewUserForm(emptyNewUserState);
        loadUsers();
      }
    } catch {
      setUserManagementError('Failed to create user.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (targetId: string) => {
    if (targetId === userId) {
      setUserManagementError('You cannot delete your own account.');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this user? This cannot be undone.');
    if (!confirmed) return;

    setDeletingUserId(targetId);
    setUserManagementError(null);
    setUserManagementSuccess(null);

    try {
      const response = await apiService.deleteUser(targetId);
      if (response.error) {
        setUserManagementError(response.error);
      } else {
        setUserManagementSuccess('User deleted successfully.');
        loadUsers();
      }
    } catch {
      setUserManagementError('Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!userId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
        <p className="mt-2 text-sm text-gray-500">
          You need to be logged in to manage account settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
            <p className="text-sm text-gray-500">Manage your personal information and contact details.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="+45 1234 5678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Street, City, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="https://example.com/image.jpg"
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="e.g., CEO & Founder, Creative Director, Event Afholder"
              />
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <button
                type="button"
                onClick={() => initialData && setFormData(initialData)}
                disabled={!hasChanges || saving}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!hasChanges || saving}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Password</h2>
          <p className="text-sm text-gray-500">Update your password to keep your account secure.</p>
        </div>

        {passwordError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {passwordSuccess}
          </div>
        )}

        <form className="space-y-6" onSubmit={handlePasswordSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Enter current password"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Enter new password"
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <button
              type="button"
              onClick={() => {
                setPasswordForm(emptyPasswordState);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              disabled={passwordSaving}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!canSubmitPassword}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {passwordSaving ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-500">Add new admins or remove existing accounts (except your own).</p>
          </div>
        </div>

        {userManagementError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {userManagementError}
          </div>
        )}

        {userManagementSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {userManagementSuccess}
          </div>
        )}

        <form className="grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={handleCreateUser}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
            <input
              type="text"
              value={newUserForm.firstName}
              onChange={(e) => handleNewUserFieldChange('firstName', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
            <input
              type="text"
              value={newUserForm.lastName}
              onChange={(e) => handleNewUserFieldChange('lastName', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={newUserForm.email}
              onChange={(e) => handleNewUserFieldChange('email', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={newUserForm.password}
              onChange={(e) => handleNewUserFieldChange('password', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="At least 8 characters"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-3 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={() => {
                setNewUserForm(emptyNewUserState);
                setUserManagementError(null);
                setUserManagementSuccess(null);
              }}
              disabled={creatingUser}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!canCreateUser}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {creatingUser ? 'Creating...' : 'Add user'}
            </button>
          </div>
        </form>

        <div className="mt-4">
          {usersLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : usersError ? (
            <p className="text-sm text-red-600">{usersError}</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.map((teamMember) => {
                    const fullName = [teamMember.firstName, teamMember.lastName].filter(Boolean).join(' ') || teamMember.email;
                    const disabled = teamMember.id === userId;
                    const initials = [teamMember.firstName?.[0], teamMember.lastName?.[0]].filter(Boolean).join('').toUpperCase() || teamMember.email[0].toUpperCase();
                    const hasImageError = imageErrors.has(teamMember.id);
                    const showImage = teamMember.imageUrl && !hasImageError;
                    return (
                      <tr key={teamMember.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-3">
                            {showImage ? (
                              <img
                                src={teamMember.imageUrl}
                                alt={fullName}
                                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                                onError={() => {
                                  setImageErrors((prev) => new Set(prev).add(teamMember.id));
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-gray-200 flex items-center justify-center text-xs font-semibold text-blue-700">
                                {initials}
                              </div>
                            )}
                            <span>{fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{teamMember.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDeleteUser(teamMember.id)}
                              disabled={disabled || deletingUserId === teamMember.id}
                              className="text-sm font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingUserId === teamMember.id ? 'Removing...' : disabled ? 'Your account' : 'Remove'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

