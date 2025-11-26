import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useAuth } from "../contexts/AuthContext";
import { UserPermission } from "../types";
import {
  ArrowLeft,
  Save,
  User as UserIcon,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { getDefaultPermissionsForRole, PAGES, ACTIONS } from "../utils/permissions";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    role: "user" as const,
    isActive: true,
    password: "",
    confirmPassword: "",
    permissions: [] as UserPermission[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default permissions for user role
    setFormData((prev) => ({
      ...prev,
      permissions: getDefaultPermissionsForRole("user"),
    }));
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePermissionChange = (
    page: string,
    action: string,
    checked: boolean
  ) => {
    console.log(`🔐 Permission change: ${page} - ${action} = ${checked}`);

    setFormData((prev) => {
      const newPermissions = [...prev.permissions];
      const existingPermission = newPermissions.find((p) => p.page === page);

      if (existingPermission) {
        if (checked) {
          if (!existingPermission.actions.includes(action as any)) {
            existingPermission.actions.push(action as any);
          }

          // Auto-select read permission if create, edit, or delete is selected
          if (
            (action === ACTIONS.CREATE || action === ACTIONS.EDIT || action === ACTIONS.DELETE) &&
            !existingPermission.actions.includes(ACTIONS.READ)
          ) {
            existingPermission.actions.push(ACTIONS.READ);
          }
        } else {
          existingPermission.actions = existingPermission.actions.filter(
            (a) => a !== action
          );

          // If removing read permission, also remove other permissions that depend on it
          if (action === ACTIONS.READ) {
            existingPermission.actions = existingPermission.actions.filter(
              (a) => a !== ACTIONS.CREATE && a !== ACTIONS.EDIT && a !== ACTIONS.DELETE
            );
          }

          if (existingPermission.actions.length === 0) {
            // Remove permission if no actions left
            const index = newPermissions.findIndex((p) => p.page === page);
            if (index > -1) {
              newPermissions.splice(index, 1);
            }
          }
        }
      } else if (checked) {
        const actions = [action as any];

        // Auto-select read permission if create, edit, or delete is selected
        if (
          (action === ACTIONS.CREATE || action === ACTIONS.EDIT || action === ACTIONS.DELETE) &&
          !actions.includes(ACTIONS.READ)
        ) {
          actions.push(ACTIONS.READ);
        }

        newPermissions.push({
          page,
          actions,
        });
      }

      console.log("📋 Updated permissions:", newPermissions);
      return { ...prev, permissions: newPermissions };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t("users.errors.nameRequired");
    }

    if (!formData.username.trim()) {
      newErrors.username = t("users.errors.usernameRequired");
    } else if (formData.username.length < 3) {
      newErrors.username = t("users.errors.usernameTooShort");
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t("users.errors.usernameInvalid");
    }

    if (!formData.password) {
      newErrors.password = t("users.errors.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("users.errors.passwordTooShort");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("users.errors.passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("🔧 Creating user with permissions:", formData.permissions);

      const userData = {
        username: formData.username,
        full_name: formData.full_name,
        password: formData.password,
        role: "user" as const,
        permissions: formData.permissions,
      };

      console.log("📋 User data being sent:", userData);
      console.log("📋 Form data full_name field:", formData.full_name);
      console.log("📋 UserData full_name field:", userData.full_name);
      await createUser(userData);

      // Navigate back to users list
      navigate("/users");
    } catch (error) {
      console.error("Error creating user:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("profiles_username_check")) {
          setErrors((prev) => ({
            ...prev,
            username:
              t("users.usernameConstraintError"),
          }));
        } else if (error.message.includes("email already exists")) {
          setErrors((prev) => ({
            ...prev,
            email: t("users.emailExists"),
          }));
        } else if (error.message.includes("username")) {
          setErrors((prev) => ({
            ...prev,
            username: t("users.usernameTaken"),
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            submit: t("users.failedToCreate"),
          }));
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: "Failed to create user. Please try again.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const getPageDisplayName = (page: string): string => {
    const pageNames: Record<string, string> = {
      dashboard: t("navigation.dashboard"),
      customers: t("navigation.customers"),
      contracts: t("navigation.contracts"),
      vehicles: t("navigation.vehicles"),
      payments: t("navigation.payments"),
      companies: t("navigation.companies"),
      "overdue-notifications": t("navigation.overdueNotifications"),
    };
    return pageNames[page] || page;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/users")}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("users.backToUsers")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserIcon className="w-6 h-6 mr-2" />
              {t("users.createUser")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("users.createNewUserAccount")}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {errors.submit}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
      
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("users.basicInformation")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <Label htmlFor="full_name">{t("users.name")} *</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder={t("users.namePlaceholder")}
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username">{t("users.username")} *</Label>
              <Input
                id="username"
                type="text"
                value={formData.username || ""}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder={t("users.usernamePlaceholder")}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Security Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t("users.security")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password */}
            <div>
              <Label htmlFor="password">{t("users.password")} *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder={t("users.passwordPlaceholder")}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">
                {t("users.confirmPassword")} *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder={t("users.confirmPasswordPlaceholder")}
                  className={
                    errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Permissions Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("users.permissions")}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t("users.permissionsNote")}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">
                    {t("users.page")}
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                    <div className="flex items-center justify-center space-x-2">
                      <span>{t("permissions.read")}</span>
                      <Checkbox
                        checked={Object.values(PAGES).filter(page => page !== PAGES.USERS).every((page) =>
                          formData.permissions
                            .find((p) => p.page === page)
                            ?.actions.includes(ACTIONS.READ)
                        )}
                        onCheckedChange={(checked) => {
                          Object.values(PAGES).filter(page => page !== PAGES.USERS).forEach((page) => {
                            handlePermissionChange(
                              page,
                              ACTIONS.READ,
                              checked as boolean
                            );
                          });
                        }}
                      />
                    </div>
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                    <div className="flex items-center justify-center space-x-2">
                      <span>{t("permissions.create")}</span>
                      <Checkbox
                        checked={Object.values(PAGES).filter(page => page !== PAGES.USERS).every((page) =>
                          formData.permissions
                            .find((p) => p.page === page)
                            ?.actions.includes(ACTIONS.CREATE)
                        )}
                        onCheckedChange={(checked) => {
                          Object.values(PAGES).filter(page => page !== PAGES.USERS).forEach((page) => {
                            handlePermissionChange(
                              page,
                              ACTIONS.CREATE,
                              checked as boolean
                            );
                          });
                        }}
                      />
                    </div>
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                    <div className="flex items-center justify-center space-x-2">
                      <span>{t("permissions.edit")}</span>
                      <Checkbox
                        checked={Object.values(PAGES).filter(page => page !== PAGES.USERS).every((page) =>
                          formData.permissions
                            .find((p) => p.page === page)
                            ?.actions.includes("edit")
                        )}
                        onCheckedChange={(checked) => {
                          Object.values(PAGES).filter(page => page !== PAGES.USERS).forEach((page) => {
                            handlePermissionChange(
                              page,
                              ACTIONS.EDIT,
                              checked as boolean
                            );
                          });
                        }}
                      />
                    </div>
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                    <div className="flex items-center justify-center space-x-2">
                      <span>{t("permissions.delete")}</span>
                      <Checkbox
                        checked={Object.values(PAGES).filter(page => page !== PAGES.USERS).every((page) =>
                          formData.permissions
                            .find((p) => p.page === page)
                            ?.actions.includes(ACTIONS.DELETE)
                        )}
                        onCheckedChange={(checked) => {
                          Object.values(PAGES).filter(page => page !== PAGES.USERS).forEach((page) => {
                            handlePermissionChange(
                              page,
                              ACTIONS.DELETE,
                              checked as boolean
                            );
                          });
                        }}
                      />
                    </div>
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                    <span>{t("users.selectAll")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const availablePages = Object.values(PAGES).filter(page => page !== PAGES.USERS);
                  return availablePages;
                })().map((page) => {
                  const currentPermission = formData.permissions.find(
                    (p) => p.page === page
                  );
                  const actions = [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE];
                  const allSelected = actions.every((action) =>
                    currentPermission?.actions.includes(action as any)
                  );

                  return (
                    <tr key={page} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900 capitalize">
                        {getPageDisplayName(page)}
                      </td>
                      {actions.map((action) => (
                        <td
                          key={action}
                          className="border border-gray-200 px-4 py-2 text-center"
                        >
                          <Checkbox
                            checked={
                              currentPermission?.actions.includes(
                                action as any
                              ) || false
                            }
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                page,
                                action,
                                checked as boolean
                              )
                            }
                          />
                        </td>
                      ))}
                      <td className="border border-gray-200 px-4 py-2 text-center">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) => {
                            actions.forEach((action) => {
                              handlePermissionChange(
                                page,
                                action,
                                checked as boolean
                              );
                            });
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>{t("users.permissionsNote")}</p>
          </div>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/users")}
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <>
                {t("users.creating")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t("users.create")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserCreate;
