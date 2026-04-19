import { pgEnum } from "drizzle-orm/pg-core";

export const userRolesEnum = pgEnum("user_roles_enum", [
    "VISITOR",
    "REGISTERED_USER",
    "AUTHOR",
    "EDITOR",
    "NEWSPAPER_MANAGER",
    "DIRECTOR",
    "SYSTEM_ADMINISTRATOR"
]);

export const articleStateEnum = pgEnum("article_state", [
    "DRAFT",
    "SUBMITTED",
    "IN_REVIEW",
    "APPROVED_BY_EDITOR",
    "APPROVED_BY_MANAGER",
    "APPROVED_BY_DIRECTOR",
    "PUBLISHED",
    "REJECTED"
]);

export const reviewDecisionsEnum = pgEnum("review_decisions", [
    "APPROVED",
    "REJECTED",
    "REVISION_REQUESTED"
]);

export const auditResultEnum = pgEnum("audit_result", [
    "SUCCESS",
    "FAILURE"
]);