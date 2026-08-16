import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/LoginView.vue"),
      meta: { requiresAuth: false },
    },

    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/member/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/admin/dashboard",
      name: "admin-dashboard",
      component: () => import("@/views/staff/DashboardView.vue"),
      meta: { requiresAuth: true, roles: ["nep_admin"] },
    },
    {
      path: "/map",
      name: "map",
      component: () => import("@/views/staff/MapView.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/admin/taxonomy",
      name: "admin-taxonomy",
      component: () => import("@/views/admin/TaxonomyManagement.vue"),
      meta: { requiresAuth: true, roles: ["nep_admin"] },
    },
    {
      path: "/policy",
      name: "policy",
      component: () => import("@/views/staff/PolicyView.vue"),
      meta: { requiresAuth: true, permission: "policy.view" },
    },
    {
      path: "/manager/dashboard",
      name: "manager-dashboard",
      component: () => import("@/views/staff/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/entries/new",
      name: "entry-new",
      component: () => import("@/views/programme/NewEntryView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/entries/:id",
      name: "entry-detail",
      component: () => import("@/views/EntryDetailView.vue"),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: "/admin/users",
      name: "admin-users",
      component: () => import("@/views/admin/UserManagementView.vue"),
      meta: { requiresAuth: true, permission: "users.view" },
    },
    {
      path: "/admin/roles",
      name: "admin-roles",
      component: () => import("@/views/admin/RolesManagementView.vue"),
      meta: { requiresAuth: true, permission: "roles.view" },
    },
    {
      path: "/admin/permissions",
      name: "admin-permissions",
      component: () => import("@/views/admin/PermissionsManagementView.vue"),
      meta: { requiresAuth: true, permission: "permissions.view" },
    },
    {
      path: "/admin/coordinators",
      name: "admin-coordinators",
      component: () => import("@/views/admin/CoordinatorManagementView.vue"),
      meta: { requiresAuth: true, roles: ["nep_admin"] },
    },
    {
      path: "/adviser",
      name: "adviser",
      component: () => import("@/views/adviser/AdviserListView.vue"),
      meta: { requiresAuth: true, roles: ["nep_coordinator", "nep_admin"] },
    },
    {
      path: "/adviser/new",
      name: "adviser-new",
      component: () => import("@/views/adviser/NewSubmissionView.vue"),
      meta: { requiresAuth: true, roles: ["nep_coordinator", "nep_admin"] },
    },
    {
      path: "/adviser/entry/:entryId",
      name: "adviser-entry-detail",
      component: () => import("@/views/adviser/AdvisoryNoteView.vue"),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: "/adviser/:id",
      name: "adviser-detail",
      component: () => import("@/views/adviser/AdviserDetailView.vue"),
      meta: { requiresAuth: true, roles: ["nep_coordinator", "nep_admin"] },
    },
    {
      path: "/admin/programmes",
      name: "admin-programmes",
      component: () => import("@/views/admin/AdminProgrammesView.vue"),
      meta: { requiresAuth: true, roles: ["nep_admin", "nep_coordinator"] },
    },
    {
      path: "/admin/organization",
      name: "admin-organization",
      component: () => import("@/views/admin/OrganizationManagementView.vue"),
      meta: { requiresAuth: true, roles: ["nep_admin"] },
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("@/views/errors/403.vue"),
    },
    {
      path: "/account",
      name: "organisation-profile",
      component: () => import("@/views/member/OrganisationProfileView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("@/views/auth/ForgotPasswordView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("@/views/auth/ResetPasswordView.vue"),
      meta: { requiresAuth: false },
    },
  ],
});

/**
 * Extracted from router.beforeEach so it can be unit tested directly with
 * plain mock `to` objects, without driving a real navigation (which would
 * otherwise pull in every lazy-loaded view component along the way).
 */
export async function authGuard(to: RouteLocationNormalized) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "login" };
  }

  if (to.name === "login" && isAuthenticated) {
    if (authStore.userRole === "nep_admin") {
      return { name: "admin-dashboard" };
    } else if (authStore.userRole === "nep_coordinator") {
      return { name: "manager-dashboard" };
    } else {
      return { name: "dashboard" };
    }
  }

  if (isAuthenticated && !authStore.currentUser) {
    try {
      await authStore.fetchCurrentUser();
      useNotificationStore().init()
    } catch {
      authStore.clearAuthState(false);
      return { name: "login" };
    }
  }

  if (isAuthenticated) {
    // Preferred: permission-based guard — works for any role, built-in or
    // admin-created, since it checks the user's actual ability list rather
    // than a hardcoded role name.
    const requiredPermission = to.meta.permission as string | string[] | undefined;
    if (requiredPermission) {
      const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      const allowed = authStore.isSuperAdmin || required.some((p) => authStore.permissions.includes(p));
      if (!allowed) {
        return { name: "forbidden" };
      }
    }

    // Legacy: role-name guard, still used by routes not yet migrated to
    // permission-based checks.
    const allowedRoles = to.meta.roles as string[] | undefined;
    if (allowedRoles?.length && !allowedRoles.includes(authStore.userRole)) {
      return { name: "forbidden" };
    }
  }

  return true;
}

router.beforeEach(authGuard);

export default router;
