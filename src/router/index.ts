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
      meta: { requiresAuth: true, permission: "dashboard.view" },
    },
    {
      path: "/map",
      name: "map",
      component: () => import("@/views/staff/MapView.vue"),
      meta: { requiresAuth: true, permission: "reports.view" },
    },
    {
      path: "/admin/taxonomy",
      name: "admin-taxonomy",
      component: () => import("@/views/admin/TaxonomyManagement.vue"),
      meta: { requiresAuth: true, permission: "taxonomy.view" },
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
      meta: { requiresAuth: true, permission: "dashboard.view" },
    },
    {
      path: "/entries/new",
      name: "entry-new",
      component: () => import("@/views/programme/NewEntryView.vue"),
      meta: { requiresAuth: true, permission: "programmes.create" },
    },
    {
      path: "/entries/:id",
      name: "entry-detail",
      component: () => import("@/views/EntryDetailView.vue"),
      meta: { requiresAuth: true, permission: "programmes.view" },
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
      meta: { requiresAuth: true, permission: "roles.view" },
    },
    {
      path: "/adviser",
      name: "adviser",
      component: () => import("@/views/adviser/AdviserListView.vue"),
      meta: { requiresAuth: true, permission: "advisory.view-all" },
    },
    {
      path: "/adviser/new",
      name: "adviser-new",
      component: () => import("@/views/adviser/NewSubmissionView.vue"),
      meta: { requiresAuth: true, permission: "advisory.view-all" },
    },
    {
      path: "/adviser/entry/:entryId",
      name: "adviser-entry-detail",
      component: () => import("@/views/adviser/AdvisoryNoteView.vue"),
      meta: { requiresAuth: true, permission: "advisory.view" },
      props: true,
    },
    {
      path: "/adviser/:id",
      name: "adviser-detail",
      component: () => import("@/views/adviser/AdviserDetailView.vue"),
      meta: { requiresAuth: true, permission: "advisory.view-all" },
    },
    {
      path: "/admin/programmes",
      name: "admin-programmes",
      component: () => import("@/views/admin/AdminProgrammesView.vue"),
      meta: { requiresAuth: true, permission: "programmes.view" },
    },
    {
      path: "/admin/organization",
      name: "admin-organization",
      component: () => import("@/views/admin/OrganizationManagementView.vue"),
      meta: { requiresAuth: true, permission: "organisations.view" },
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
    if (authStore.userRole === "member_org") return { name: "dashboard" };
    // For all staff roles: redirect to the first route they have permission for
    const staffRoutes: Array<{ permission: string; name: string }> = [
      { permission: "dashboard.view", name: "admin-dashboard" },
      { permission: "programmes.view", name: "admin-programmes" },
      { permission: "advisory.view-all", name: "adviser" },
      { permission: "reports.view", name: "map" },
      { permission: "users.view", name: "admin-users" },
      { permission: "organisations.view", name: "admin-organization" },
      { permission: "roles.view", name: "admin-roles" },
      { permission: "permissions.view", name: "admin-permissions" },
      { permission: "taxonomy.view", name: "admin-taxonomy" },
      { permission: "policy.view", name: "policy" },
    ];
    const first = authStore.isSuperAdmin
      ? staffRoutes[0]
      : staffRoutes.find((r) => authStore.permissions.includes(r.permission));
    return first ? { name: first.name } : { name: "map" };
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
      // Permission check passed — skip the legacy roles check below.
      return true;
    }

    // Legacy: role-name guard, used by routes not yet migrated to
    // permission-based checks. Custom roles bypass this if they have
    // no required permission defined on the route.
    const allowedRoles = to.meta.roles as string[] | undefined;
    if (allowedRoles?.length && !authStore.isSuperAdmin && !allowedRoles.includes(authStore.userRole)) {
      return { name: "forbidden" };
    }
  }

  return true;
}

router.beforeEach(authGuard);

export default router;
