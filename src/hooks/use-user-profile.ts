"use client"

import { useState } from "react"
import type { UserProfile } from "@/lib/types"

export function useUserProfile() {
  const [userProfile] = useState<UserProfile>({
    id: "user_" + Math.random().toString(36).substr(2, 9),
    name: "",
    age: 0,
    email: "",
    phone: "",
    address: "",
    insurance: "",
    conditions: [],
    medications: [],
    allergies: [],
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    preferredPharmacy: {
      name: "",
      address: "",
      phone: "",
    },
  })

  return { userProfile }
}
