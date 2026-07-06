import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability"

import { USER_ROLE, type UserRole } from "@db/schema"

export const APP_ACTION = {
  CREATE: "create",
  DELETE: "delete",
  MANAGE: "manage",
  READ: "read",
  UPDATE: "update",
} as const

export const APP_SUBJECT = {
  ABSENCE: "Absence",
  ALLOCATION: "Allocation",
  BILL: "Bill",
  HOUSEHOLD: "Household",
  PAYMENT: "Payment",
  TENANT: "Tenant",
} as const

export type AppAction = (typeof APP_ACTION)[keyof typeof APP_ACTION]
export type AppSubject = (typeof APP_SUBJECT)[keyof typeof APP_SUBJECT]
export type AppAbility = MongoAbility<[AppAction, AppSubject]>

export const defineAbilityForRole = (role: UserRole): AppAbility => {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  if (role === USER_ROLE.ADMIN) {
    can(APP_ACTION.MANAGE, APP_SUBJECT.HOUSEHOLD)
    can(APP_ACTION.MANAGE, APP_SUBJECT.TENANT)
    can(APP_ACTION.MANAGE, APP_SUBJECT.BILL)
    can(APP_ACTION.MANAGE, APP_SUBJECT.ALLOCATION)
    can(APP_ACTION.MANAGE, APP_SUBJECT.PAYMENT)
    can(APP_ACTION.MANAGE, APP_SUBJECT.ABSENCE)

    return build()
  }

  can(APP_ACTION.READ, APP_SUBJECT.HOUSEHOLD)
  can(APP_ACTION.READ, APP_SUBJECT.TENANT)
  can(APP_ACTION.READ, APP_SUBJECT.BILL)
  can(APP_ACTION.READ, APP_SUBJECT.ALLOCATION)
  can(APP_ACTION.READ, APP_SUBJECT.PAYMENT)
  can(APP_ACTION.CREATE, APP_SUBJECT.ABSENCE)
  can(APP_ACTION.UPDATE, APP_SUBJECT.ABSENCE)
  can(APP_ACTION.DELETE, APP_SUBJECT.ABSENCE)

  return build()
}
